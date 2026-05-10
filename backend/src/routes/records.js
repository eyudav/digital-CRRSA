import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireRole("staff"));

router.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const { rows } = await query(
      `select a.id, a.service_type, a.status, a.created_at, u.full_name as citizen_name
       from applications a
       join users u on u.id = a.citizen_id
       where cast(a.id as text) ilike $1 or u.full_name ilike $1
       order by a.created_at desc
       limit 100`,
      [`%${q}%`]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
