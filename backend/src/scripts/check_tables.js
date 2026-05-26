import { pool } from "../config/db.js";

async function check() {
  try {
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("--- existing tables ---");
    console.log(tables.rows.map(r => r.table_name));

    for (const table of ['households', 'household_members', 'form_templates']) {
      const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      console.log(`--- ${table} columns ---`);
      console.log(cols.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
