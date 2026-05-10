import { query } from "../config/db.js";

export async function createNotification({ userId, channel, title, body }) {
  if (channel === "in_app") {
    return query(
      `insert into notifications (user_id, channel, title, body, status, sent_at)
       values ($1, $2, $3, $4, 'sent', now())`,
      [userId, channel, title, body]
    );
  }
  return query(
    `insert into notifications (user_id, channel, title, body, status)
     values ($1, $2, $3, $4, 'queued')`,
    [userId, channel, title, body]
  );
}

export async function markNotificationSent(id) {
  return query(`update notifications set status = 'sent', sent_at = now() where id = $1`, [id]);
}
