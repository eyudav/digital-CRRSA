import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification } from "../services/notificationService.js";
import {
  ensureAppointmentForApplication,
  countAppointmentsForApplication,
} from "../services/appointmentAssignment.js";

const router = express.Router();
router.use(requireAuth, requireRole("staff", "admin", "super_admin"));

router.get("/dashboard", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `select status, count(*)::int as total from applications group by status order by status`
    );
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
    [applicationId]
  );
  return rows[0] || null;
}

router.patch("/applications/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    let { status, comment } = req.body || {};
    const allowed = new Set([
      "Submitted",
      "Under Review",
      "Additional Documents Required",
      "Approved",
      "Rejected",
      "Ready for Collection",
      "Completed",
      "Scheduled",
    ]);
    if (!allowed.has(status)) return res.status(400).json({ message: "Invalid status value" });

    const app = await query(
      `select id, citizen_id, office_code, service_type from applications where id = $1`,
      [id]
    );
    if (!app.rowCount) return res.status(404).json({ message: "Application not found" });
    const { citizen_id: citizenId, office_code: officeCode } = app.rows[0];

    if (status === "Approved") {
      let appt = await getLatestAppointmentSummary(id);
      if (!appt) {
        const ensured = await ensureAppointmentForApplication({
          applicationId: id,
          citizenId,
          officeCode,
        });
        if (ensured.created === false && ensured.error === "no_slot") {
          await query(`update applications set status = $1, updated_at = now() where id = $2`, [
            "Approved",
            id,
          ]);
          await query(
            `insert into application_status_history (application_id, status, comment, changed_by)
             values ($1, $2, $3, $4)`,
            [id, "Approved", comment || "Application approved.", req.user.sub]
          );
          await createNotification({
            userId: citizenId,
            channel: "in_app",
            title: "Application approved",
            body: `Your application #${id} has been approved. Office scheduling will contact you with an appointment slot.`,
          });
          return res.json({ message: "Application status updated", appointment: null });
        }
        appt = await getLatestAppointmentSummary(id);
      }

      if (!appt) {
        await query(`update applications set status = $1, updated_at = now() where id = $2`, [
          "Approved",
          id,
        ]);
        await query(
          `insert into application_status_history (application_id, status, comment, changed_by)
           values ($1, $2, $3, $4)`,
          [id, "Approved", comment || "Application approved.", req.user.sub]
        );
        await createNotification({
          userId: citizenId,
          channel: "in_app",
          title: "Application approved",
          body: `Your application #${id} has been approved.`,
        });
        return res.json({ message: "Application status updated", appointment: null });
      }

      const dateStr = appt.slot_date ? String(appt.slot_date).slice(0, 10) : "";
      const schedComment = `Appointment scheduled for ${dateStr} at ${appt.office_code}. Queue number ${appt.queue_number}.`;

      await query(`update applications set status = $1, updated_at = now() where id = $2`, [
        "Scheduled",
        id,
      ]);
      await query(
        `insert into application_status_history (application_id, status, comment, changed_by)
         values ($1, $2, $3, $4)`,
        [id, "Approved", comment || "Application approved.", req.user.sub]
      );
      await query(
        `insert into application_status_history (application_id, status, comment, changed_by)
         values ($1, $2, $3, $4)`,
        [id, "Scheduled", schedComment, req.user.sub]
      );
      await createNotification({
        userId: citizenId,
        channel: "in_app",
        title: "Application scheduled",
        body: `Your application #${id} is approved and scheduled. ${schedComment}`,
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

    await query(`update applications set status = $1, updated_at = now() where id = $2`, [status, id]);
    await query(
      `insert into application_status_history (application_id, status, comment, changed_by)
       values ($1, $2, $3, $4)`,
      [id, status, comment || null, req.user.sub]
    );
    await createNotification({
      userId: citizenId,
      channel: "in_app",
      title: "Application Status Updated",
      body: `Your application #${id} is now "${status}".`,
    });
    return res.json({ message: "Application status updated" });
  } catch (err) {
    return next(err);
  }
});

router.patch("/applications/:applicationId/documents/:documentId", async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const documentId = Number(req.params.documentId);
    const verified = Boolean(req.body?.verified);

    const appCheck = await query(`select id from applications where id = $1`, [applicationId]);
    if (!appCheck.rowCount) {
      return res.status(404).json({ message: "Application not found" });
    }

    const { rows } = await query(
      `update application_documents set verified = $1 where id = $2 and application_id = $3 returning *`,
      [verified, documentId, applicationId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
