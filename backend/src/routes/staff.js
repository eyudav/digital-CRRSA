import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification } from "../services/notificationService.js";

const router = express.Router();
router.use(requireAuth, requireRole("staff"));

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

router.patch("/applications/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, comment } = req.body;
    const allowed = new Set([
      "Submitted",
      "Under Review",
      "Additional Documents Required",
      "Approved",
      "Rejected",
      "Ready for Collection",
      "Completed",
    ]);
    if (!allowed.has(status)) return res.status(400).json({ message: "Invalid status value" });

    const app = await query(`select id, citizen_id from applications where id = $1`, [id]);
    if (!app.rowCount) return res.status(404).json({ message: "Application not found" });

    await query(`update applications set status = $1, updated_at = now() where id = $2`, [status, id]);
    await query(
      `insert into application_status_history (application_id, status, comment, changed_by)
       values ($1, $2, $3, $4)`,
      [id, status, comment || null, req.user.sub]
    );
    await createNotification({
      userId: app.rows[0].citizen_id,
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
