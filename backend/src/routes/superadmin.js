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

router.get("/audit-logs", async (_req, res, next) => {
  try {
    const { rows } = await query(
      `select l.id, l.actor_user_id, a.full_name as actor_name, l.action, l.entity_type, l.entity_id, l.details, l.created_at
       from audit_logs l
       left join users a on a.id = l.actor_user_id
       order by l.created_at desc
       limit 500`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
