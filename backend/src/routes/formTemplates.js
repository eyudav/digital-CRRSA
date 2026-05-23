import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// GET /api/form-templates — list all active templates
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query(
      `select id, service_slug, service_name, fields, version from form_templates where is_active = true order by service_name`
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

// GET /api/form-templates/:slug
router.get("/:slug", async (req, res, next) => {
  try {
    const { rows } = await query(
      `select id, service_slug, service_name, fields, version from form_templates where service_slug = $1 and is_active = true`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ message: "Form template not found" });
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
