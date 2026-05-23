import multer from "multer";
import { env } from "../config/env.js";

const allowedMimes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.uploadMaxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      return cb(new Error("Invalid file format. Only PDF/JPG/PNG allowed."));
    }
    return cb(null, true);
  },
});
