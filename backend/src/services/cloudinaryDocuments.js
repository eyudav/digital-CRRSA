import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";

function assertCloudinarySecret() {
  if (!env.cloudinaryApiSecret) {
    throw new Error("Cloudinary is not configured. Missing CLOUDINARY_API_SECRET.");
  }
}

export async function uploadCitizenDocument(file) {
  assertCloudinarySecret();
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  const uploaded = await cloudinary.uploader.upload(dataUri, {
    folder: "citizen_documents",
    resource_type: "auto",
    use_filename: true,
    filename_override: file.originalname,
    unique_filename: true,
  });

  return {
    secureUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
    format: uploaded.format || null,
  };
}

export function optimizedCloudinaryUrl(publicId, mimeType = "") {
  if (!publicId) return null;
  if (!String(mimeType).startsWith("image/")) return null;
  return cloudinary.url(publicId, {
    fetch_format: "auto",
    quality: "auto",
  });
}

export function cloudinaryDownloadUrl(publicId, originalName = "document") {
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    resource_type: "auto",
    type: "upload",
    flags: "attachment",
    attachment: originalName,
  });
}
