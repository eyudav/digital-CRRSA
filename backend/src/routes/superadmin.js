import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireRole("super_admin"));

const settingsFile = path.resolve("system_settings.json");

router.get("/settings", async (_req, res, next) => {
  try {
    const data = await fs.readFile(settingsFile, "utf-8").catch(() => "{}");
    return res.json(JSON.parse(data));
  } catch (err) {
    return next(err);
  }
});

router.patch("/settings", async (req, res, next) => {
  try {
    const existing = await fs.readFile(settingsFile, "utf-8").catch(() => "{}");
    const merged = { ...JSON.parse(existing), ...req.body };
    await fs.writeFile(settingsFile, JSON.stringify(merged, null, 2));
    return res.json(merged);
  } catch (err) {
    return next(err);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    const email = req.query.email || "";
    let sql = `select l.id, l.actor_user_id, a.full_name as actor_name, a.email as actor_email, l.action, l.entity_type, l.entity_id, l.details, l.created_at
       from audit_logs l
       left join users a on a.id = l.actor_user_id`;
    const params = [];
    if (email.trim()) {
      sql += ` where a.email ilike $1`;
      params.push(`%${email.trim()}%`);
    }
    sql += ` order by l.created_at desc limit 500`;

    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
