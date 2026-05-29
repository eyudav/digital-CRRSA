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

const LOG_TYPE_FILTERS = {
  auth: ["AUTH_%"],
  profile: ["AUTH_CHANGE_PASSWORD", "AUTH_REGISTER"],
  admin: ["ADMIN_%"],
  application: ["APPLICATION_%", "STAFF_%"],
  user: ["ADMIN_CREATE_USER", "ADMIN_UPDATE_USER", "ADMIN_DEACTIVATE_USER", "ADMIN_ACTIVATE_USER"],
};

router.get("/audit-logs", async (req, res, next) => {
  try {
    const email = req.query.email || "";
    const type = String(req.query.type || "all").toLowerCase();
    let sql = `select l.id, l.actor_user_id, a.full_name as actor_name, a.email as actor_email, l.action, l.entity_type, l.entity_id, l.details, l.created_at
       from audit_logs l
       left join users a on a.id = l.actor_user_id`;
    const params = [];
    const clauses = [];
    if (email.trim()) {
      params.push(`%${email.trim()}%`);
      clauses.push(`a.email ilike $${params.length}`);
    }
    const patterns = LOG_TYPE_FILTERS[type];
    if (patterns?.length) {
      const orParts = patterns.map((p) => {
        params.push(p);
        return `l.action ilike $${params.length}`;
      });
      clauses.push(`(${orParts.join(" or ")})`);
    }
    if (clauses.length) sql += ` where ${clauses.join(" and ")}`;
    sql += ` order by l.created_at desc limit 500`;

    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
