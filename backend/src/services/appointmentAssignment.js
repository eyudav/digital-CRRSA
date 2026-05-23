import { query } from "../config/db.js";

/**
 * Returns next available slot row { id, booked, capacity } for an office, or any office if none match.
 */
export async function pickNextAvailableSlot(officeCode) {
  const pick = async (office) => {
    const { rows } = await query(
      `select s.id, s.capacity, count(a.id)::int as booked
       from appointment_slots s
       left join appointments a on a.slot_id = s.id
       where ($1::text is null or s.office_code = $1)
         and s.slot_date >= current_date
       group by s.id, s.capacity
       having count(a.id) < s.capacity
       order by s.slot_date, s.start_time
       limit 1`,
      [office]
    );
    return rows[0] || null;
  };

  let slot = await pick(officeCode);
  if (!slot) slot = await pick(null);
  return slot;
}

export async function countAppointmentsForApplication(applicationId) {
  const { rows } = await query(
    `select count(*)::int as c from appointments where application_id = $1`,
    [applicationId]
  );
  return rows[0]?.c ?? 0;
}

/**
 * Creates an appointment row if the application has none. Returns { created: boolean, queueNumber?, slotId? }.
 */
export async function ensureAppointmentForApplication({ applicationId, citizenId, officeCode }) {
  const existing = await countAppointmentsForApplication(applicationId);
  if (existing > 0) {
    return { created: false };
  }

  const slot = await pickNextAvailableSlot(officeCode);
  if (!slot) {
    return { created: false, error: "no_slot" };
  }

  const queueNumber = Number(slot.booked) + 1;
  await query(
    `insert into appointments (application_id, citizen_id, slot_id, queue_number, status)
     values ($1, $2, $3, $4, 'Scheduled')`,
    [applicationId, citizenId, slot.id, queueNumber]
  );
  return { created: true, queueNumber, slotId: slot.id };
}
