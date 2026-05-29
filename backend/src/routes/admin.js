import express from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { logAudit } from "../services/auditService.js";

const router = express.Router();

router.use(requireAuth);

function assertSuperAdminTargetOnly(actorRole, targetRole, action) {
  if (actorRole === "super_admin" && targetRole !== "admin") {
    return `Super admin can only ${action} admin accounts`;
  }
  return null;
}

function assertAdminTargetOnly(actorRole, targetRole, action) {
  if (actorRole === "admin" && !["staff", "citizen"].includes(targetRole)) {
    return `Admin can only ${action} staff and citizen accounts`;
  }
  return null;
}

router.get("/users", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const role = req.query.role ? String(req.query.role) : null;
    const params = [];
    let where = "where 1=1";

    if (req.user.role === "super_admin") {
      if (role && !["admin", "super_admin"].includes(role)) {
        return res.status(403).json({ message: "Super admin can only list admin accounts" });
      }
      where += " and role in ('admin', 'super_admin')";
      if (role) {
        params.push(role);
        where += ` and role = $${params.length}`;
      }
    } else if (req.user.role === "admin") {
      if (role && !["staff", "citizen"].includes(role)) {
        return res.status(403).json({ message: "Admin can only list staff and citizen accounts" });
      }
      where += " and role in ('staff', 'citizen')";
      if (role) {
        params.push(role);
        where += ` and role = $${params.length}`;
      }
    }

    const { rows } = await query(
      `select id, full_name, email, role, sub_city, woreda, phone, address, is_active, created_at
       from users
       ${where}
       order by created_at desc`,
      params,
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

    if (!fullName || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "fullName, email, password, role, and phone are required" });
    }

    if (actorRole === "super_admin") {
      if (role !== "admin") {
        return res.status(403).json({ message: "Super admin can only create admin accounts" });
      }
      if (!subCity?.trim()) {
        return res.status(400).json({ message: "subCity is required for admin accounts" });
      }
    }

    if (actorRole === "admin") {
      if (role !== "staff") {
        return res.status(403).json({ message: "Admin accounts can only create staff users" });
      }
      if (!subCity?.trim() || !woreda?.trim()) {
        return res.status(400).json({ message: "subCity and woreda are required for staff accounts" });
      }
    }

    if (role === "super_admin") {
      return res.status(403).json({ message: "Super admin accounts cannot be created via this endpoint" });
    }

    if (role === "admin" && actorRole !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can create admin" });
    }

    const existing = await query(`select id from users where email = $1`, [String(email).toLowerCase()]);
    if (existing.rowCount) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const insertWoreda = role === "admin" ? null : woreda || null;

    const { rows } = await query(
      `insert into users (full_name, email, password_hash, role, sub_city, woreda, phone, address, is_active)
       values ($1, $2, $3, $4, $5, $6, $7, $8, true)
       returning id, full_name, email, role, sub_city, woreda, phone, address, is_active, created_at`,
      [
        fullName,
        String(email).toLowerCase(),
        passwordHash,
        role,
        subCity || null,
        insertWoreda,
        phone || null,
        address || null,
      ],
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

router.post("/users/:id/activate", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) return res.status(400).json({ message: "Invalid user id" });
    const { rows: targetRows } = await query(`select id, role, is_active from users where id = $1`, [targetId]);
    const target = targetRows[0];
    if (!target) return res.status(404).json({ message: "User not found" });

    const superErr = assertSuperAdminTargetOnly(req.user.role, target.role, "activate");
    if (superErr) return res.status(403).json({ message: superErr });
    const adminErr = assertAdminTargetOnly(req.user.role, target.role, "activate");
    if (adminErr) return res.status(403).json({ message: adminErr });

    await query(`update users set is_active = true where id = $1`, [targetId]);
    await logAudit({
      actorUserId: req.user.sub,
      action: "ADMIN_ACTIVATE_USER",
      entityType: "user",
      entityId: String(targetId),
      details: { role: target.role },
    });
    return res.json({ message: "User activated" });
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

    const superErr = assertSuperAdminTargetOnly(req.user.role, target.role, "deactivate");
    if (superErr) return res.status(403).json({ message: superErr });
    const adminErr = assertAdminTargetOnly(req.user.role, target.role, "deactivate");
    if (adminErr) return res.status(403).json({ message: adminErr });

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

router.get("/audit-logs", requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const email = req.query.email || "";
    let sql = `select l.id, l.actor_user_id, a.full_name as actor_name, a.email as actor_email, l.action, l.entity_type, l.entity_id, l.details, l.created_at
       from audit_logs l
       left join users a on a.id = l.actor_user_id`;
    const params = [];
    const clauses = [];
    if (req.user.role === "admin") {
      clauses.push(`(a.role is null or a.role in ('staff', 'citizen'))`);
      clauses.push(`(
        l.action ilike 'STAFF_%'
        or l.action in (
          'AUTH_REGISTER',
          'AUTH_LOGIN'
        )
      )`);
    }
    if (email.trim()) {
      params.push(`%${email.trim()}%`);
      clauses.push(`a.email ilike $${params.length}`);
    }
    if (clauses.length) sql += ` where ${clauses.join(" and ")}`;
    sql += ` order by l.created_at desc limit 300`;

    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
