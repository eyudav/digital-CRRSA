import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth, requireRole("staff", "admin", "super_admin"));

router.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q || "";
    let sql = `select a.id, a.service_type, a.status, a.document_upload_status, a.created_at, a.reference_number,
              u.full_name as citizen_name
       from applications a
       join users u on u.id = a.citizen_id
       where (
         cast(a.id as text) ilike $1
         or coalesce(a.reference_number, '') ilike $1
         or u.full_name ilike $1
         or a.service_type ilike $1
       )`;
    const params = [`%${q}%`];

    if (req.user.role === "staff") {
      sql += ` and u.sub_city = $2 and u.woreda = $3`;
      params.push(req.user.subCity);
      params.push(req.user.woreda);
    }

    sql += ` order by a.created_at desc limit 200`;

    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
