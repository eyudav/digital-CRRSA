import { pool } from "../config/db.js";

async function run() {
  try {
    const { rows } = await pool.query("SELECT * FROM application_documents LIMIT 10;");
    console.log("--- application_documents rows ---");
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
