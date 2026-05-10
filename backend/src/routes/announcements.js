import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `select id, title, body, category, created_at, posted_by from announcements order by created_at desc`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { title, body, category } = req.body;
    if (!title || !body) return res.status(400).json({ message: "Title and body are required" });
    const cat = typeof category === "string" && category.trim() ? category.trim() : "general";

    const { rows } = await query(
      `insert into announcements (title, body, category, posted_by) values ($1, $2, $3, $4) returning *`,
      [title, body, cat, req.user.sub]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
