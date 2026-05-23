import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import path from "node:path";
import fs from "node:fs";
import { requireAuth, requireRole } from "./middleware/auth.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "digital-cerca-hub-backend" });
});

app.get("/api/documents/:filename", requireAuth, requireRole("staff", "admin", "super_admin"), (req, res, next) => {
  try {
    const filename = req.params.filename;
    const documentPath = path.resolve("backend/uploads", filename);
    if (!fs.existsSync(documentPath)) {
      return res.status(404).json({ message: "Document not found" });
    }
    return res.sendFile(documentPath);
  } catch (err) {
    return next(err);
  }
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
