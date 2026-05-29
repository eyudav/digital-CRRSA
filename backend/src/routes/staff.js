import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification } from "../services/notificationService.js";
import {
  ensureAppointmentForApplication,
  countAppointmentsForApplication,
} from "../services/appointmentAssignment.js";
import { logAudit } from "../services/auditService.js";

const router = express.Router();
router.use(requireAuth, requireRole("staff", "admin", "super_admin"));

router.get("/dashboard", async (req, res, next) => {
  try {
    let rows;
    if (req.user.role === "staff") {
      const result = await query(
        `select a.status, count(*)::int as total
         from applications a
         join users u on u.id = a.citizen_id
         where u.sub_city = $1 and u.woreda = $2
         group by a.status
         order by a.status`,
        [req.user.subCity, req.user.woreda],
      );
      rows = result.rows;
    } else {
      const result = await query(
        `select status, count(*)::int as total from applications group by status order by status`,
      );
      rows = result.rows;
    }
    return res.json({ statusSummary: rows });
  } catch (err) {
    return next(err);
  }
});

async function getLatestAppointmentSummary(applicationId) {
  const { rows } = await query(
    `select ap.queue_number, s.office_code, s.slot_date, s.start_time, s.end_time
     from appointments ap
     join appointment_slots s on s.id = ap.slot_id
     where ap.application_id = $1
     order by ap.id desc
     limit 1`,
    [applicationId],
  );
  return rows[0] || null;
}

router.patch("/applications/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    let { status, comment } = req.body || {};
    const allowed = new Set([
      "Submitted",
      "Additional Documents Required",
      "Approved",
      "Rejected",
      "Ready for Collection",
      "Scheduled",
    ]);
    if (!allowed.has(status))
      return res.status(400).json({ message: "Invalid status value" });

    const app = await query(
      `select a.id, a.citizen_id, a.office_code, a.service_type, a.form_data, u.sub_city, u.woreda
       from applications a
       join users u on u.id = a.citizen_id
       where a.id = $1`,
      [id],
    );
    if (!app.rowCount)
      return res.status(404).json({ message: "Application not found" });
    const appData = app.rows[0];

    const { rows: statusRows } = await query(
      `select status from applications where id = $1`,
      [id],
    );
    const currentStatus = statusRows[0]?.status;
    if (
      status === "Ready for Collection" &&
      !["Approved", "Scheduled"].includes(currentStatus)
    ) {
      return res.status(400).json({
        message:
          "Application must be approved before marking ready for collection",
      });
    }
    const {
      citizen_id: citizenId,
      office_code: officeCode,
      sub_city: citizenSubCity,
      woreda: citizenWoreda,
    } = appData;

    if (req.user.role === "staff") {
      if (
        citizenSubCity !== req.user.subCity ||
        citizenWoreda !== req.user.woreda
      ) {
        return res
          .status(403)
          .json({
            message:
              "Forbidden: You can only review applications within your assigned subcity and woreda",
          });
      }
    }

    if (status === "Approved") {
      // Sync Residence ID approval to citizen_profiles and users
      if (appData.service_type === "Residence ID Services") {
        const formData = appData.form_data || {};
        const generatedId =
          "ETH-" +
          Math.floor(1000 + Math.random() * 9000) +
          "-" +
          Math.floor(1000 + Math.random() * 9000);

        await query(
          `update citizen_profiles
           set full_name = coalesce($1, full_name),
               sex = coalesce($2, sex),
               date_of_birth = coalesce($3, date_of_birth),
               mother_name = coalesce($4, mother_name),
               father_name = coalesce($5, father_name),
               phone_number = coalesce($6, phone_number),
               email = coalesce($7, email),
               nationality = coalesce($8, nationality),
               sub_city = coalesce($9, sub_city),
               woreda = coalesce($10, woreda),
               address = coalesce($11, address),
               residence_id_number = coalesce(residence_id_number, $12),
               updated_at = now()
           where user_id = $13`,
          [
            formData.fullName || null,
            formData.sex || null,
            formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
            formData.motherName || null,
            formData.fatherName || null,
            formData.phone || null,
            formData.email || null,
            formData.nationality || "Ethiopian",
            formData.subCity || appData.office_code.split(" — ").pop() || null,
            formData.woreda || null,
            formData.address || null,
            generatedId,
            citizenId,
          ],
        );

        await query(
          `update users
           set sub_city = coalesce($1, sub_city),
               woreda = coalesce($2, woreda),
               phone = coalesce($3, phone),
               address = coalesce($4, address)
           where id = $5`,
          [
            formData.subCity || null,
            formData.woreda || null,
            formData.phone || null,
            formData.address || null,
            citizenId,
          ],
        );
      }
    }

    if (status === "Approved") {
      let appt = await getLatestAppointmentSummary(id);
      if (!appt) {
        const ensured = await ensureAppointmentForApplication({
          applicationId: id,
          citizenId,
          officeCode,
        });
        if (ensured.created === false && ensured.error === "no_slot") {
          await query(
            `update applications set status = $1, updated_at = now() where id = $2`,
            ["Approved", id],
          );
          await query(
            `insert into application_status_history (application_id, status, comment, changed_by)
             values ($1, $2, $3, $4)`,
            [id, "Approved", comment || "Application approved.", req.user.sub],
          );
          await createNotification({
            userId: citizenId,
            channel: "in_app",
            title: "Application approved",
            body: `Your application #${id} has been approved. Office scheduling will contact you with an appointment slot.`,
          });
          await logAudit({
            actorUserId: req.user.sub,
            action: "STAFF_APPLICATION_APPROVE",
            entityType: "application",
            entityId: String(id),
            details: { status: "Approved" },
          });
          return res.json({
            message: "Application status updated",
            appointment: null,
          });
        }
        appt = await getLatestAppointmentSummary(id);
      }

      if (!appt) {
        await query(
          `update applications set status = $1, updated_at = now() where id = $2`,
          ["Approved", id],
        );
        await query(
          `insert into application_status_history (application_id, status, comment, changed_by)
           values ($1, $2, $3, $4)`,
          [id, "Approved", comment || "Application approved.", req.user.sub],
        );
        await createNotification({
          userId: citizenId,
          channel: "in_app",
          title: "Application approved",
          body: `Your application #${id} has been approved.`,
        });
        await logAudit({
          actorUserId: req.user.sub,
          action: "STAFF_APPLICATION_APPROVE",
          entityType: "application",
          entityId: String(id),
          details: { status: "Approved" },
        });
        return res.json({
          message: "Application status updated",
          appointment: null,
        });
      }

      const dateStr = appt.slot_date ? String(appt.slot_date).slice(0, 10) : "";
      const schedComment = `Appointment scheduled for ${dateStr} at ${appt.office_code}. Queue number ${appt.queue_number}.`;

      await query(
        `update applications set status = $1, updated_at = now() where id = $2`,
        ["Scheduled", id],
      );
      await query(
        `insert into application_status_history (application_id, status, comment, changed_by)
         values ($1, $2, $3, $4)`,
        [id, "Approved", comment || "Application approved.", req.user.sub],
      );
      await query(
        `insert into application_status_history (application_id, status, comment, changed_by)
         values ($1, $2, $3, $4)`,
        [id, "Scheduled", schedComment, req.user.sub],
      );
      await createNotification({
        userId: citizenId,
        channel: "in_app",
        title: "Application scheduled",
        body: `Your application #${id} is approved and scheduled. ${schedComment}`,
      });
      await logAudit({
        actorUserId: req.user.sub,
        action: "STAFF_APPLICATION_SCHEDULE",
        entityType: "application",
        entityId: String(id),
        details: { status: "Scheduled", queueNumber: appt.queue_number },
      });
      return res.json({
        message: "Application status updated",
        appointment: {
          queueNumber: appt.queue_number,
          officeCode: appt.office_code,
          slotDate: appt.slot_date,
          startTime: appt.start_time,
          endTime: appt.end_time,
        },
      });
    }

    await query(
      `update applications set status = $1, updated_at = now() where id = $2`,
      [status, id],
    );
    await query(
      `insert into application_status_history (application_id, status, comment, changed_by)
       values ($1, $2, $3, $4)`,
      [id, status, comment || null, req.user.sub],
    );
    await createNotification({
      userId: citizenId,
      channel: "in_app",
      title: "Application Status Updated",
      body: `Your application #${id} is now "${status}".`,
    });
    const actionByStatus = {
      Rejected: "STAFF_APPLICATION_REJECT",
      "Additional Documents Required": "STAFF_APPLICATION_DOCS_REQUIRED",
      "Ready for Collection": "STAFF_APPLICATION_READY",
    };
    await logAudit({
      actorUserId: req.user.sub,
      action: actionByStatus[status] || "STAFF_APPLICATION_STATUS",
      entityType: "application",
      entityId: String(id),
      details: { status, previousStatus: currentStatus },
    });
    return res.json({ message: "Application status updated" });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  "/applications/:applicationId/documents/:documentId",
  async (req, res, next) => {
    try {
      const applicationId = Number(req.params.applicationId);
      const documentId = Number(req.params.documentId);
      const verified = Boolean(req.body?.verified);

      const appCheck = await query(
        `select a.id, u.sub_city, u.woreda
       from applications a
       join users u on u.id = a.citizen_id
       where a.id = $1`,
        [applicationId],
      );
      if (!appCheck.rowCount) {
        return res.status(404).json({ message: "Application not found" });
      }
      if (req.user.role === "staff") {
        const appData = appCheck.rows[0];
        if (
          appData.sub_city !== req.user.subCity ||
          appData.woreda !== req.user.woreda
        ) {
          return res
            .status(403)
            .json({
              message:
                "Forbidden: You can only review applications within your assigned subcity and woreda",
            });
        }
      }

      const { rows } = await query(
        `update application_documents set verified = $1 where id = $2 and application_id = $3 returning *`,
        [verified, documentId, applicationId],
      );
      if (!rows.length) {
        return res.status(404).json({ message: "Document not found" });
      }
      return res.json(rows[0]);
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
