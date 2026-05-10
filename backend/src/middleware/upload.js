import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

const uploadDir = path.resolve("backend/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.uploadMaxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      return cb(new Error("Invalid file format. Only PDF/JPG/PNG allowed."));
    }
    return cb(null, true);
  },
});
