import express from "express";
import { query } from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { appointmentSchema } from "../utils/validators.js";

const router = express.Router();

router.get("/available", requireAuth, requireRole("citizen"), async (req, res, next) => {
  try {
    const { officeCode, date } = req.query;
    const { rows } = await query(
      `select s.id, s.office_code, s.slot_date, s.start_time, s.end_time, s.capacity,
              (s.capacity - count(a.id)) as available
       from appointment_slots s
       left join appointments a on a.slot_id = s.id
       where ($1::text is null or s.office_code = $1)
         and ($2::date is null or s.slot_date = $2)
       group by s.id
       having (s.capacity - count(a.id)) > 0
       order by s.slot_date, s.start_time`,
      [officeCode || null, date || null]
    );
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.post("/", requireAuth, requireRole("citizen"), async (req, res, next) => {
  try {
    const payload = appointmentSchema.parse(req.body);
    const appCheck = await query(
      `select id from applications where id = $1 and citizen_id = $2`,
      [payload.applicationId, req.user.sub]
    );
    if (!appCheck.rowCount) {
      return res.status(404).json({ message: "Application not found for this user" });
    }

    const slot = await query(
      `select s.id, s.capacity, count(a.id)::int as booked
       from appointment_slots s
       left join appointments a on a.slot_id = s.id
       where s.id = $1 and s.office_code = $2
       group by s.id`,
      [payload.slotId, payload.officeCode]
    );

    if (!slot.rowCount) return res.status(404).json({ message: "Slot not found" });
    if (slot.rows[0].booked >= slot.rows[0].capacity) {
      return res.status(400).json({ message: "Selected slot is full" });
    }

    const queueNumber = slot.rows[0].booked + 1;
    const { rows } = await query(
      `insert into appointments (application_id, citizen_id, slot_id, queue_number, status)
       values ($1, $2, $3, $4, 'Scheduled')
       returning *`,
      [payload.applicationId, req.user.sub, payload.slotId, queueNumber]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    return next(err);
  }
});

export default router;
