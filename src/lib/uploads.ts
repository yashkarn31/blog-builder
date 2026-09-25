import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const UPLOAD_NAME_RE = /^[a-z0-9-]+\.webp$/;

const MAX_WIDTH = 1600;
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff"]);

/**
 * Validates the bytes really are an image (not trusting the client's MIME
 * type), strips metadata, auto-rotates, downsizes to at most 1600px wide and
 * re-encodes as WebP. Returns the public URL.
 */
export async function saveImage(input: Buffer) {
  const image = sharp(input, { failOn: "error" });
  const meta = await image.metadata().catch(() => null);
  if (!meta?.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new Error("Unsupported image format");
  }

  const { data, info } = await image
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), data);

  return { url: `/uploads/${name}`, width: info.width, height: info.height, bytes: info.size };
}
