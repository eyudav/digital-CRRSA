import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  const schemaPath = path.join(__dirname, "../../db/schema.sql");
  const sql = await fs.readFile(schemaPath, "utf8");
  await pool.query(sql);
  console.log("Database schema initialized.");
}

init()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
