import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 10),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "dqfiy6bb5",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "965786597643366",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};
