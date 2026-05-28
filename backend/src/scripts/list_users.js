import { pool } from "../config/db.js";

async function run() {
  try {
    const { rows } = await pool.query("select * from citizen_profiles");
    console.log("Citizen profiles in DB:", rows);
  } catch (err) {
    console.error("Failed to list users:", err);
  } finally {
    await pool.end();
  }
}

run();
