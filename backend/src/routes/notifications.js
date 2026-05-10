import express from "express";
import { query } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/my", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `select * from notifications where user_id = $1 order by created_at desc`,
      [req.user.sub]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

export default router;
