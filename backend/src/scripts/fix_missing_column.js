import { pool } from "../config/db.js";

async function fix() {
  try {
    await pool.query("ALTER TABLE applications ADD COLUMN IF NOT EXISTS document_upload_status text not null default 'NOT_UPLOADED';");
    console.log("Column added successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

fix();
