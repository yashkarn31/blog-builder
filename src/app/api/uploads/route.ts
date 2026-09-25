import { NextResponse } from "next/server";
import { ApiError, requireApiUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES, saveImage } from "@/lib/uploads";

/** Accepts one image (multipart field `file`), optimises it and returns its URL. */
export const POST = route(async (req) => {
  const user = await requireApiUser();
  if (!rateLimit(`upload:${user.id}`, 30, 60_000)) throw new ApiError(429, "Too many uploads. Slow down a little.");

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "No file uploaded.");
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "Image must be 8 MB or smaller.");
  if (!file.type.startsWith("image/")) throw new ApiError(415, "Only image files are allowed.");

  try {
    const saved = await saveImage(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(saved, { status: 201 });
  } catch {
    throw new ApiError(415, "That file doesn't look like a supported image (JPG, PNG, WebP, GIF, AVIF).");
  }
});
