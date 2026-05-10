import express from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { env } from "../config/env.js";
import { loginSchema, registerSchema } from "../utils/validators.js";
import { requireAuth } from "../middleware/auth.js";
import { buildVerificationEmail, sendEmail } from "../services/emailService.js";
import { logAudit } from "../services/auditService.js";

const router = express.Router();

function publicUserRow(u) {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    role: u.role,
    subCity: u.sub_city,
    woreda: u.woreda,
    phone: u.phone,
    address: u.address,
    emailVerified: Boolean(u.email_verified),
    isActive: Boolean(u.is_active),
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    if (payload.role === "admin" || payload.role === "super_admin") {
      return res.status(403).json({ message: "Admin accounts must be created by super admin." });
    }
    const existing = await query(`select id from users where email = $1`, [payload.email]);
    if (existing.rowCount) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const { rows } = await query(
      `insert into users (full_name, email, password_hash, role, sub_city, woreda, phone, address, email_verified)
       values ($1, $2, $3, $4, $5, $6, $7, $8, false)
       returning id, full_name, email, role, sub_city, woreda, phone, address, email_verified, is_active`,
      [
        payload.fullName,
        payload.email,
        passwordHash,
        payload.role,
        payload.subCity,
        payload.woreda,
        payload.phone || null,
        payload.address || null,
      ]
    );
    const u = rows[0];
    const profile = await query(
      `insert into citizen_profiles (user_id) values ($1)
       on conflict (user_id) do update set user_id = excluded.user_id
       returning id`,
      [u.id]
    );
    await query(
      `insert into core_identity_data (profile_id, full_name, phone_number, email, sub_city, woreda, address)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (profile_id) do update
       set full_name = excluded.full_name,
           phone_number = excluded.phone_number,
           email = excluded.email,
           sub_city = excluded.sub_city,
           woreda = excluded.woreda,
           address = excluded.address,
           updated_at = now()`,
      [profile.rows[0].id, u.full_name, u.phone, u.email, u.sub_city, u.woreda, u.address]
    );
    const verificationToken = crypto.randomBytes(24).toString("hex");
    await query(
      `insert into email_verification_tokens (user_id, token, expires_at)
       values ($1, $2, now() + interval '24 hours')`,
      [u.id, verificationToken]
    );
    const verifyUrl = `http://localhost:${env.port}/api/auth/verify-email?token=${verificationToken}`;
    const mail = buildVerificationEmail({ fullName: u.full_name, verificationLink: verifyUrl });
    await sendEmail({
      to: u.email,
      subject: mail.subject,
      html: mail.html,
    });
    await logAudit({
      actorUserId: u.id,
      action: "AUTH_REGISTER",
      entityType: "user",
      entityId: String(u.id),
      details: { role: u.role, subCity: u.sub_city, woreda: u.woreda },
    });
    return res.status(201).json({
      user: publicUserRow(u),
      verificationRequired: true,
    });
  } catch (err) {
    return next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const { rows } = await query(
      `select id, full_name, email, role, password_hash, sub_city, woreda, phone, address, email_verified, is_active
       from users where email = $1`,
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
    if (!user.email_verified) {
      return res.status(403).json({ message: "Email not verified. Please verify before login." });
    }
    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn,
    });
    return res.json({
      token,
      user: publicUserRow(user),
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `select id, full_name, email, role, sub_city, woreda, phone, address, email_verified, is_active
       from users where id = $1`,
      [req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    return res.json({ user: publicUserRow(rows[0]) });
  } catch (err) {
    return next(err);
  }
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const { fullName, phone, address, subCity, woreda } = req.body || {};
    const { rows } = await query(
      `update users
       set full_name = coalesce($1, full_name),
           phone = coalesce($2, phone),
           address = coalesce($3, address),
           sub_city = coalesce($4, sub_city),
           woreda = coalesce($5, woreda)
       where id = $6
       returning id, full_name, email, role, sub_city, woreda, phone, address, email_verified, is_active`,
      [fullName || null, phone || null, address || null, subCity || null, woreda || null, req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    const u = rows[0];
    const profile = await query(
      `insert into citizen_profiles (user_id) values ($1)
       on conflict (user_id) do update set user_id = excluded.user_id
       returning id`,
      [u.id]
    );
    await query(
      `insert into core_identity_data (profile_id, full_name, phone_number, email, sub_city, woreda, address)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (profile_id) do update
       set full_name = excluded.full_name,
           phone_number = excluded.phone_number,
           email = excluded.email,
           sub_city = excluded.sub_city,
           woreda = excluded.woreda,
           address = excluded.address,
           updated_at = now()`,
      [profile.rows[0].id, u.full_name, u.phone, u.email, u.sub_city, u.woreda, u.address]
    );
    return res.json({ user: publicUserRow(u) });
  } catch (err) {
    return next(err);
  }
});

router.get("/verify-email", async (req, res, next) => {
  try {
    const token = String(req.query.token || "");
    if (!token) return res.status(400).json({ message: "Verification token is required" });
    const { rows } = await query(
      `select id, user_id, expires_at, used_at
       from email_verification_tokens
       where token = $1`,
      [token]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ message: "Invalid verification token" });
    if (row.used_at) return res.status(400).json({ message: "Verification token already used" });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ message: "Verification token expired" });
    }
    await query(`update users set email_verified = true where id = $1`, [row.user_id]);
    await query(`update email_verification_tokens set used_at = now() where id = $1`, [row.id]);
    await logAudit({
      actorUserId: row.user_id,
      action: "EMAIL_VERIFIED",
      entityType: "user",
      entityId: String(row.user_id),
      details: {},
    });
    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    return next(err);
  }
});

export default router;
