import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ensureRuntimeSchema } from "../services/schemaGuard.js";

const router = express.Router();

/** Public list: published announcements only (for citizens and landing). */
router.get("/", async (_req, res, next) => {
  try {
    await ensureRuntimeSchema();
    const { rows } = await query(
      `select id, title, body, category, created_at, posted_by
       from announcements
       where coalesce(published, true) = true
       order by created_at desc`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

/** Staff / admin: all announcements including drafts. */
router.get("/manage", requireAuth, requireRole("staff", "admin", "super_admin"), async (_req, res, next) => {
  try {
    await ensureRuntimeSchema();
    const { rows } = await query(
      `select id, title, body, category, created_at, posted_by, coalesce(published, true) as published
       from announcements
       order by created_at desc`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res, next) => {
  try {
    await ensureRuntimeSchema();
    const { title, body, category, published } = req.body || {};
    if (!title || !body) return res.status(400).json({ message: "Title and body are required" });
    const cat = typeof category === "string" && category.trim() ? category.trim() : "general";
    const pub = published === false ? false : true;

    const { rows } = await query(
      `insert into announcements (title, body, category, posted_by, published) values ($1, $2, $3, $4, $5) returning *`,
      [title, body, cat, req.user.sub, pub]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch("/:id", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res, next) => {
  try {
    await ensureRuntimeSchema();
    const id = Number(req.params.id);
    const { title, body, category, published } = req.body || {};

    const existing = await query(`select posted_by from announcements where id = $1`, [id]);
    if (!existing.rowCount) return res.status(404).json({ message: "Not found" });

    if (req.user.role === "staff" && String(existing.rows[0].posted_by) !== String(req.user.sub)) {
      return res.status(403).json({ message: "Staff can only edit their own announcements" });
    }

    const cat = typeof category === "string" && category.trim() ? category.trim() : null;
    const pub = typeof published === "boolean" ? published : null;

    const { rows } = await query(
      `update announcements
       set title = coalesce($1, title),
           body = coalesce($2, body),
           category = coalesce($3, category),
           published = coalesce($4, published)
       where id = $5
       returning *`,
      [title || null, body || null, cat, pub, id]
    );
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res, next) => {
  try {
    await ensureRuntimeSchema();
    const id = Number(req.params.id);
    const existing = await query(`select posted_by from announcements where id = $1`, [id]);
    if (!existing.rowCount) return res.status(404).json({ message: "Not found" });

    if (req.user.role === "staff" && String(existing.rows[0].posted_by) !== String(req.user.sub)) {
      return res.status(403).json({ message: "Staff can only delete their own announcements" });
    }

    await query(`delete from announcements where id = $1`, [id]);
    return res.json({ message: "Deleted" });
  } catch (err) {
    return next(err);
  }
});

export default router;
