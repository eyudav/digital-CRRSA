import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

async function seed() {
  const email = "eyudawit"; // Treating username as email for login compat
  const password = "@Eyudawit1354";
  const fullName = "System Super Admin";
  const role = "super_admin";

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rowCount > 0) {
      console.log("Super admin already exists!");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, email_verified)
       VALUES ($1, $2, $3, $4, true, true)`,
      [fullName, email, passwordHash, role]
    );
    console.log("Super admin seeded successfully.");
  } catch (err) {
    console.error("Failed to seed super admin:", err);
  } finally {
    pool.end();
  }
}

seed();
