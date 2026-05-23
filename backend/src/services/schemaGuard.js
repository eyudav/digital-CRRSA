import { query } from "../config/db.js";

let ensured = false;

export async function ensureRuntimeSchema() {
  if (ensured) return;
  await query(`
    alter table announcements add column if not exists published boolean not null default true;
    alter table application_documents add column if not exists original_file_name text;
    alter table application_documents add column if not exists original_file text;
    alter table application_documents add column if not exists cloudinary_secure_url text;
    alter table application_documents add column if not exists cloudinary_public_id text;
    alter table application_documents add column if not exists cloudinary_format text;
    alter table application_documents add column if not exists uploaded_at timestamptz not null default now();
    update application_documents set original_file_name = file_name where original_file_name is null;
    update application_documents set original_file = coalesce(original_file_name, file_name) where original_file is null;
  `);
  ensured = true;
}
