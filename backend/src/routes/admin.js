import express from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAudit } from "../services/auditService.js";

const router = express.Router();

router.use(requireAuth);

router.get("/users", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const role = req.query.role ? String(req.query.role) : null;
    const params = [];
    let where = "where 1=1";
    if (role) {
      params.push(role);
      where += ` and role = $${params.length}`;
    }
    
    if (req.user.role !== "super_admin") {
      where += " and role != 'super_admin'";
      where += " and role != 'citizen'";
    }

    if (role === "citizen" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can list citizen accounts" });
    }

    const { rows } = await query(
      `select id, full_name, email, role, sub_city, woreda, phone, address, email_verified, is_active, created_at
       from users
       ${where}
       order by created_at desc`,
      params
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/users", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const actorRole = req.user.role;
    const { fullName, email, password, role, subCity, woreda, phone, address } = req.body || {};
    if (!fullName || !email || !password || !role || !subCity || !phone) {
      return res.status(400).json({ message: "fullName, email, password, role, subCity, and phone are required" });
    }
    if (actorRole === "admin" && role !== "staff") {
      return res.status(403).json({ message: "Admin accounts can only create staff users" });
    }
    if (role === "super_admin" && actorRole !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can create super admin" });
    }
    if (role === "admin" && actorRole !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can create admin" });
    }
    if (role === "staff" && !["admin", "super_admin"].includes(actorRole)) {
      return res.status(403).json({ message: "Only admin or super admin can create staff" });
    }
    if (!["staff", "admin", "super_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role for admin user creation" });
    }
    const existing = await query(`select id from users where email = $1`, [String(email).toLowerCase()]);
    if (existing.rowCount) return res.status(409).json({ message: "Email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `insert into users (full_name, email, password_hash, role, sub_city, woreda, phone, address, email_verified, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, $8, true, true)
       returning id, full_name, email, role, sub_city, woreda, phone, address, email_verified, is_active, created_at`,
      [fullName, String(email).toLowerCase(), passwordHash, role, subCity || null, woreda || null, phone || null, address || null]
    );
    await logAudit({
      actorUserId: req.user.sub,
      action: "ADMIN_CREATE_USER",
      entityType: "user",
      entityId: String(rows[0].id),
      details: { role },
    });
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.patch("/users/:id", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) return res.status(400).json({ message: "Invalid user id" });
    const { fullName, email, phone, subCity, woreda, address } = req.body || {};

    const { rows: targetRows } = await query(`select id, role from users where id = $1`, [targetId]);
    const target = targetRows[0];
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can edit admin accounts" });
    }
    if (target.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can edit super admin accounts" });
    }
    if (target.role === "citizen" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can edit citizen accounts" });
    }

    const updates = [];
    const params = [];
    let i = 1;
    if (fullName != null && String(fullName).trim()) {
      updates.push(`full_name = $${i++}`);
      params.push(String(fullName).trim());
    }
    if (email != null && String(email).trim()) {
      const em = String(email).trim().toLowerCase();
      const clash = await query(`select id from users where lower(email) = $1 and id != $2`, [em, targetId]);
      if (clash.rowCount) return res.status(409).json({ message: "Email already in use" });
      updates.push(`email = $${i++}`);
      params.push(em);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${i++}`);
      params.push(phone || null);
    }
    if (subCity !== undefined) {
      updates.push(`sub_city = $${i++}`);
      params.push(subCity || null);
    }
    if (woreda !== undefined) {
      updates.push(`woreda = $${i++}`);
      params.push(woreda || null);
    }
    if (address !== undefined) {
      updates.push(`address = $${i++}`);
      params.push(address || null);
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    params.push(targetId);
    const { rows } = await query(
      `update users set ${updates.join(", ")} where id = $${i} returning id, full_name, email, role, sub_city, woreda, phone, address, email_verified, is_active, created_at`,
      params
    );
    await logAudit({
      actorUserId: req.user.sub,
      action: "ADMIN_UPDATE_USER",
      entityType: "user",
      entityId: String(targetId),
      details: { fields: updates.map((u) => u.split(" = ")[0]) },
    });
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete("/users/:id", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) return res.status(400).json({ message: "Invalid user id" });
    if (targetId === Number(req.user.sub)) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }
    const { rows: targetRows } = await query(`select id, role, is_active from users where id = $1`, [targetId]);
    const target = targetRows[0];
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can deactivate super admin" });
    }
    if (target.role === "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can deactivate admin" });
    }
    await query(`update users set is_active = false where id = $1`, [targetId]);
    await logAudit({
      actorUserId: req.user.sub,
      action: "ADMIN_DEACTIVATE_USER",
      entityType: "user",
      entityId: String(targetId),
      details: { previousRole: target.role },
    });
    return res.json({ message: "User deactivated" });
  } catch (err) {
    return next(err);
  }
});

router.get("/audit-logs", requireRole("admin", "super_admin"), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `select l.id, l.actor_user_id, a.full_name as actor_name, l.action, l.entity_type, l.entity_id, l.details, l.created_at
       from audit_logs l
       left join users a on a.id = l.actor_user_id
       order by l.created_at desc
       limit 300`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
