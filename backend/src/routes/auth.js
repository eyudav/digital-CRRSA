import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { env } from "../config/env.js";
import { changePasswordSchema, loginSchema, registerSchema } from "../utils/validators.js";
import { requireAuth } from "../middleware/auth.js";
import { logAudit } from "../services/auditService.js";

const router = express.Router();

async function getUserDetails(userId) {
  const { rows } = await query(
    `select u.id, u.full_name, u.email, u.role, u.sub_city, u.woreda, u.phone, u.address, u.is_active,
            cp.sex, cp.date_of_birth, cp.mother_name, cp.father_name, cp.nationality, cp.residence_id_number, cp.profile_number
     from users u
     left join citizen_profiles cp on cp.user_id = u.id
     where u.id = $1`,
    [userId]
  );
  if (!rows.length) return null;
  const u = rows[0];
  return {
    id: String(u.id),
    fullName: u.full_name,
    email: u.email,
    role: u.role,
    subCity: u.sub_city,
    woreda: u.woreda,
    phone: u.phone,
    address: u.address,
    isActive: Boolean(u.is_active),
    sex: u.sex || null,
    dateOfBirth: u.date_of_birth ? new Date(u.date_of_birth).toISOString().slice(0, 10) : null,
    motherName: u.mother_name || null,
    fatherName: u.father_name || null,
    nationality: u.nationality || null,
    residenceIdNumber: u.residence_id_number || null,
    profileNumber: u.profile_number || null,
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const existing = await query(`select id from users where email = $1`, [payload.email]);
    if (existing.rowCount) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const { rows } = await query(
      `insert into users (full_name, email, password_hash, role, sub_city, woreda, phone, address)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, full_name, email, role, sub_city, woreda, phone, address, is_active`,
      [
        payload.fullName,
        payload.email,
        passwordHash,
        "citizen",
        payload.subCity,
        payload.woreda,
        payload.phone,
        payload.address || null,
      ]
    );
    const u = rows[0];
    await query(
      `insert into citizen_profiles (
         user_id, full_name, sex, date_of_birth, mother_name, father_name,
         phone_number, email, nationality, sub_city, woreda, address, residence_id_number
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       on conflict (user_id) do update
       set full_name = excluded.full_name,
           sex = excluded.sex,
           date_of_birth = excluded.date_of_birth,
           mother_name = excluded.mother_name,
           father_name = excluded.father_name,
           phone_number = excluded.phone_number,
           email = excluded.email,
           nationality = excluded.nationality,
           sub_city = excluded.sub_city,
           woreda = excluded.woreda,
           address = excluded.address,
           residence_id_number = excluded.residence_id_number,
           updated_at = now()`,
      [
        u.id,
        u.full_name,
        payload.sex || null,
        payload.dateOfBirth ? new Date(payload.dateOfBirth) : null,
        payload.motherName || null,
        payload.fatherName || null,
        u.phone,
        u.email,
        payload.nationality || null,
        u.sub_city,
        u.woreda,
        u.address,
        payload.residenceIdNumber || null,
      ]
    );
    await logAudit({
      actorUserId: u.id,
      action: "AUTH_REGISTER",
      entityType: "user",
      entityId: String(u.id),
      details: { role: u.role, subCity: u.sub_city, woreda: u.woreda },
    });
    const details = await getUserDetails(u.id);
    return res.status(201).json({ user: details });
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const { rows } = await query(
      `select id, password_hash, is_active from users where email = $1`,
      [payload.email]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(payload.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!user.is_active) {
      return res.status(403).json({ message: "Account is inactive" });
    }
    const details = await getUserDetails(user.id);
    const token = jwt.sign({ sub: details.id, role: details.role, email: details.email }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });
    return res.json({ token, user: details });
  } catch (err) {
    return next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const details = await getUserDetails(req.user.sub);
    if (!details) return res.status(404).json({ message: "User not found" });
    return res.json({ user: details });
  } catch (err) {
    return next(err);
  }
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const { fullName, phone, address, subCity, woreda, sex, dateOfBirth, motherName, fatherName, nationality, residenceIdNumber } = req.body || {};
    const { rows } = await query(
      `update users
       set full_name = coalesce($1, full_name),
           phone = coalesce($2, phone),
           address = coalesce($3, address),
           sub_city = coalesce($4, sub_city),
           woreda = coalesce($5, woreda)
       where id = $6
       returning id`,
      [fullName || null, phone || null, address || null, subCity || null, woreda || null, req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    await query(
      `update citizen_profiles
       set full_name = coalesce($1, full_name),
           phone_number = coalesce($2, phone_number),
           address = coalesce($3, address),
           sub_city = coalesce($4, sub_city),
           woreda = coalesce($5, woreda),
           sex = coalesce($6, sex),
           date_of_birth = coalesce($7, date_of_birth),
           mother_name = coalesce($8, mother_name),
           father_name = coalesce($9, father_name),
           nationality = coalesce($10, nationality),
           residence_id_number = coalesce($11, residence_id_number),
           updated_at = now()
       where user_id = $12`,
      [
        fullName || null,
        phone || null,
        address || null,
        subCity || null,
        woreda || null,
        sex || null,
        dateOfBirth ? new Date(dateOfBirth) : null,
        motherName || null,
        fatherName || null,
        nationality || null,
        residenceIdNumber || null,
        req.user.sub
      ]
    );
    const details = await getUserDetails(req.user.sub);
    return res.json({ user: details });
  } catch (err) {
    return next(err);
  }
});

router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const payload = changePasswordSchema.parse(req.body || {});
    const { rows } = await query(`select id, password_hash from users where id = $1`, [req.user.sub]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await bcrypt.compare(payload.currentPassword, user.password_hash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });
    const newHash = await bcrypt.hash(payload.newPassword, 10);
    await query(`update users set password_hash = $1 where id = $2`, [newHash, req.user.sub]);
    await logAudit({
      actorUserId: req.user.sub,
      action: "AUTH_CHANGE_PASSWORD",
      entityType: "user",
      entityId: String(req.user.sub),
      details: {},
    });
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    return next(err);
  }
});

export default router;
