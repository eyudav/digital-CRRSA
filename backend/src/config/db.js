import { Pool } from "pg";
import { env } from "./env.js";

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}
