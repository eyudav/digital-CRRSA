import express from "express";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { env } from "../config/env.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { ensureRuntimeSchema } from "../services/schemaGuard.js";

const router = express.Router();

/** Public list: published announcements only (for citizens and landing). */
router.get("/", async (req, res, next) => {
  try {
    await ensureRuntimeSchema();
    
    let citizenSubCity = null;
    let citizenWoreda = null;
    let isLoggedInCitizen = false;
    
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, env.jwtSecret);
        const { rows } = await query(
          `select role, sub_city, woreda from users where id = $1 and is_active = true`,
          [decoded.sub]
        );
        if (rows[0] && rows[0].role === "citizen") {
          citizenSubCity = rows[0].sub_city;
          citizenWoreda = rows[0].woreda;
          isLoggedInCitizen = true;
        }
      } catch (e) {
        // ignore
      }
    }
    
    let rows;
    if (isLoggedInCitizen && citizenSubCity) {
      const result = await query(
        `select id, title, body, category, created_at, posted_by
         from announcements
         where coalesce(published, true) = true
           and (
             (sub_city is null or sub_city = '')
             or (sub_city = $1 and woreda = $2)
           )
         order by created_at desc`,
        [citizenSubCity, citizenWoreda]
      );
      rows = result.rows;
    } else {
      const result = await query(
        `select id, title, body, category, created_at, posted_by
         from announcements
         where coalesce(published, true) = true
           and (sub_city is null or sub_city = '')
         order by created_at desc`
      );
      rows = result.rows;
    }
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

/** Staff / admin: all announcements including drafts. */
router.get("/manage", requireAuth, requireRole("staff", "admin", "super_admin"), async (req, res, next) => {
  try {
    await ensureRuntimeSchema();
    let rows;
    if (req.user.role === "staff") {
      const result = await query(
        `select id, title, body, category, created_at, posted_by, coalesce(published, true) as published, sub_city, woreda
         from announcements
         where sub_city = $1 and woreda = $2
         order by created_at desc`,
        [req.user.subCity, req.user.woreda]
      );
      rows = result.rows;
    } else {
      const result = await query(
        `select id, title, body, category, created_at, posted_by, coalesce(published, true) as published, sub_city, woreda
         from announcements
         order by created_at desc`
      );
      rows = result.rows;
    }
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
      `insert into announcements (title, body, category, posted_by, published, sub_city, woreda) values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [title, body, cat, req.user.sub, pub, req.user.subCity || null, req.user.woreda || null]
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

    const existing = await query(`select posted_by, sub_city, woreda from announcements where id = $1`, [id]);
    if (!existing.rowCount) return res.status(404).json({ message: "Not found" });

    if (req.user.role === "staff") {
      const announcement = existing.rows[0];
      if (announcement.sub_city !== req.user.subCity || announcement.woreda !== req.user.woreda) {
        return res.status(403).json({ message: "Staff can only edit announcements in their assigned subcity and woreda" });
      }
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
    const existing = await query(`select posted_by, sub_city, woreda from announcements where id = $1`, [id]);
    if (!existing.rowCount) return res.status(404).json({ message: "Not found" });

    if (req.user.role === "staff") {
      const announcement = existing.rows[0];
      if (announcement.sub_city !== req.user.subCity || announcement.woreda !== req.user.woreda) {
        return res.status(403).json({ message: "Staff can only delete announcements in their assigned subcity and woreda" });
      }
    }

    await query(`delete from announcements where id = $1`, [id]);
    return res.json({ message: "Deleted" });
  } catch (err) {
    return next(err);
  }
});

export default router;
