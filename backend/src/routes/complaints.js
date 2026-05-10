import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, requireRole("citizen"), async (req, res, next) => {
  try {
    const { category, message } = req.body;
    if (!category || !message) {
      return res.status(400).json({ message: "Category and message are required" });
    }
    const { rows } = await query(
      `insert into complaints (citizen_id, category, message, status)
       values ($1, $2, $3, 'Open')
       returning *`,
      [req.user.sub, category, message]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get("/my", requireAuth, requireRole("citizen"), async (req, res, next) => {
  try {
    const { rows } = await query(
      `select * from complaints where citizen_id = $1 order by created_at desc`,
      [req.user.sub]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.get("/", requireAuth, requireRole("staff"), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `select c.*, u.full_name as citizen_name
       from complaints c
       join users u on u.id = c.citizen_id
       order by c.created_at desc`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id/status", requireAuth, requireRole("staff"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status, resolutionComment } = req.body;
    const { rows } = await query(
      `update complaints
       set status = $1, resolution_comment = $2, resolved_at = case when $1 = 'Resolved' then now() else null end
       where id = $3
       returning *`,
      [status, resolutionComment || null, id]
    );
    if (!rows.length) return res.status(404).json({ message: "Complaint not found" });
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
