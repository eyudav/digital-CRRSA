import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";

app.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`);
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
