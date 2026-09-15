import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config.js";

const uploadsDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../uploads");
const placeholders = new Set(["your-cloud-name", "your-api-key", "your-api-secret"]);

export function cloudinaryReady() {
  return Boolean(config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret && !placeholders.has(config.cloudinaryCloudName) && !placeholders.has(config.cloudinaryApiKey) && !placeholders.has(config.cloudinaryApiSecret));
}

export function verifiedImageExtension(buffer, mimeType) {
  if (mimeType === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  if (mimeType === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (mimeType === "image/webp" && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "webp";
  if (mimeType === "image/avif" && buffer.subarray(4, 8).toString() === "ftyp" && buffer.subarray(8, 12).toString().includes("avif")) return "avif";
  throw Object.assign(new Error("ফাইলটি বৈধ JPG, PNG, WebP অথবা AVIF ছবি নয়।"), { status: 422 });
}

async function saveLocally(buffer, extension) {
  await mkdir(uploadsDirectory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(join(uploadsDirectory, filename), buffer, { flag: "wx" });
  return { secure_url: `/uploads/${filename}`, public_id: filename, storage: "local" };
}

function uploadToCloudinary(buffer) {
  cloudinary.config({ cloud_name: config.cloudinaryCloudName, api_key: config.cloudinaryApiKey, api_secret: config.cloudinaryApiSecret, secure: true });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "tripti-food/products", resource_type: "image", use_filename: true, unique_filename: true, overwrite: false, transformation: [{ width: 1400, height: 1400, crop: "limit", quality: "auto", fetch_format: "auto" }] }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

export async function uploadProductImage(buffer, mimeType) {
  const extension = verifiedImageExtension(buffer, mimeType);
  if (!cloudinaryReady()) {
    if (config.nodeEnv === "production") throw Object.assign(new Error("Cloudinary configuration সম্পন্ন হয়নি।"), { status: 503 });
    return saveLocally(buffer, extension);
  }
  try {
    return await uploadToCloudinary(buffer);
  } catch (error) {
    if (config.nodeEnv !== "production" && Number(error.http_code) === 403) return saveLocally(buffer, extension);
    if ([401, 403].includes(Number(error.http_code))) throw Object.assign(new Error("Cloudinary credentials সঠিক নয়।"), { status: 502 });
    throw error;
  }
}
