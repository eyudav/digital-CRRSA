import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/applications/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await query(
      `select a.id, a.service_type, a.status, a.updated_at, a.office_code,
              coalesce(json_agg(h.*) filter (where h.id is not null), '[]') as history
       from applications a
       left join application_status_history h on h.application_id = a.id
       where a.id = $1 and ($2::text = 'staff' or a.citizen_id = $3)
       group by a.id`,
      [id, req.user.role, req.user.sub]
    );
    if (!rows.length) return res.status(404).json({ message: "Application not found" });
    return res.json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
