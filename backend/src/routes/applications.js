import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { applicationSchema } from "../utils/validators.js";
import {
  cloudinaryDownloadUrl,
  optimizedCloudinaryUrl,
  uploadCitizenDocument,
} from "../services/cloudinaryDocuments.js";
import { ensureRuntimeSchema } from "../services/schemaGuard.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole("citizen"),
  async (req, res, next) => {
    try {
      const payload = applicationSchema.parse(req.body);

      // Check for duplicates
      const existCheck = await query(
        `select id from applications where citizen_id = $1 and service_type = $2 and status not in ('Rejected')`,
        [req.user.sub, payload.serviceType],
      );
      if (existCheck.rowCount > 0) {
        return res
          .status(409)
          .json({ message: "This application has already been submitted." });
      }

      const { rows } = await query(
        `insert into applications (citizen_id, service_type, office_code, form_data, status, document_upload_status)
       values ($1, $2, $3, $4, 'Submitted', 'NOT_UPLOADED')
       returning *`,
        [
          req.user.sub,
          payload.serviceType,
          payload.officeCode,
          payload.formData,
        ],
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      return next(err);
    }
  },
);

router.get(
  "/my",
  requireAuth,
  requireRole("citizen"),
  async (req, res, next) => {
    try {
      const { rows } = await query(
        `select a.*,
              ap_sub.queue_number as appt_queue_number,
              ap_sub.office_code as appt_office_code,
              ap_sub.slot_date as appt_slot_date,
              ap_sub.start_time as appt_start_time,
              ap_sub.end_time as appt_end_time
       from applications a
       left join lateral (
         select ap.queue_number, s.office_code, s.slot_date, s.start_time, s.end_time
         from appointments ap
         join appointment_slots s on s.id = ap.slot_id
         where ap.application_id = a.id
         order by ap.id desc
         limit 1
       ) ap_sub on true
       where a.citizen_id = $1
       order by a.created_at desc`,
        [req.user.sub],
      );
      return res.json(rows);
    } catch (err) {
      return next(err);
    }
  },
);

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    await ensureRuntimeSchema();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const { rows: appRows } = await query(
      `select a.id, a.citizen_id, a.service_type, a.office_code, a.form_data, a.status, a.document_upload_status,
              a.created_at, a.updated_at, u.full_name as citizen_full_name
       from applications a
       join users u on u.id = a.citizen_id
       where a.id = $1`,
      [id],
    );
    if (!appRows.length) {
      return res.status(404).json({ message: "Application not found" });
    }
    const row = appRows[0];
    const isCitizen =
      req.user.role === "citizen" &&
      Number(req.user.sub) === Number(row.citizen_id);
    const isStaffSide = ["staff", "admin", "super_admin"].includes(
      req.user.role,
    );
    if (!isCitizen && !isStaffSide) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { rows: docRowsRaw } = await query(
      `select id, file_name, coalesce(original_file_name, original_file, file_name) as original_file_name,
              file_path, mime_type, file_size, created_at, uploaded_at,
              verified, cloudinary_secure_url, cloudinary_public_id, cloudinary_format
       from application_documents
       where application_id = $1
       order by created_at`,
      [id],
    );
    const docRows = docRowsRaw.map((d) => ({
      ...d,
      optimized_url: optimizedCloudinaryUrl(
        d.cloudinary_public_id,
        d.mime_type,
      ),
      download_url: cloudinaryDownloadUrl(
        d.cloudinary_public_id,
        d.original_file_name || d.file_name,
      ),
    }));

    const { rows: histRows } = await query(
      `select h.id, h.status, h.comment, h.changed_at, h.changed_by, u.full_name as changed_by_name
       from application_status_history h
       left join users u on u.id = h.changed_by
       where h.application_id = $1
       order by h.changed_at asc`,
      [id],
    );

    const { rows: apptRows } = await query(
      `select ap.id, ap.queue_number, ap.status as appointment_status,
              s.office_code, s.slot_date, s.start_time, s.end_time
       from appointments ap
       join appointment_slots s on s.id = ap.slot_id
       where ap.application_id = $1`,
      [id],
    );

    return res.json({
      application: row,
      documents: docRows,
      history: histRows,
      appointment: apptRows[0] || null,
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  "/:id/documents",
  requireAuth,
  requireRole("citizen"),
  upload.array("documents", 10),
  async (req, res, next) => {
    try {
      await ensureRuntimeSchema();
      const appId = Number(req.params.id);
      const files = req.files || [];
      if (!files.length) {
        return res
          .status(400)
          .json({ message: "At least one document is required" });
      }

      const appCheck = await query(
        `select id from applications where id = $1 and citizen_id = $2`,
        [appId, req.user.sub],
      );
      if (!appCheck.rowCount) {
        return res.status(404).json({ message: "Application not found" });
      }

      const inserts = files.map(async (file) => {
        const uploaded = await uploadCitizenDocument(file);
        return query(
          `insert into application_documents (
             application_id, file_name, original_file_name, file_path, mime_type, file_size,
             cloudinary_secure_url, cloudinary_public_id, cloudinary_format, uploaded_at
           )
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
          [
            appId,
            file.originalname,
            file.originalname,
            uploaded.secureUrl,
            file.mimetype,
            file.size,
            uploaded.secureUrl,
            uploaded.publicId,
            uploaded.format,
          ],
        );
      });
      await Promise.all(inserts);
      await query(
        `update applications set document_upload_status = 'UPLOADED' where id = $1`,
        [appId],
      );

      return res.status(201).json({
        message: "Documents uploaded and validated",
        count: files.length,
      });
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
