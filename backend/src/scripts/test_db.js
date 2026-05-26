import { pool } from "../config/db.js";

async function test() {
  try {
    const usersCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log("--- users table columns ---");
    console.log(usersCols.rows);

    const cpCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'citizen_profiles'
    `);
    console.log("--- citizen_profiles table columns ---");
    console.log(cpCols.rows);

    const constraints = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'users'::regclass OR conrelid = 'citizen_profiles'::regclass
    `);
    console.log("--- constraints ---");
    console.log(constraints.rows);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await pool.end();
  }
}

test();
