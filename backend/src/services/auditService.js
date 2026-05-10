import { query } from "../config/db.js";

export async function logAudit({ actorUserId = null, action, entityType, entityId = null, details = {} }) {
  await query(
    `insert into audit_logs (actor_user_id, action, entity_type, entity_id, details)
     values ($1, $2, $3, $4, $5)`,
    [actorUserId, action, entityType, entityId, details]
  );
}
