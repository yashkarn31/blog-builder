import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR, UPLOAD_NAME_RE } from "@/lib/uploads";

type Ctx = { params: Promise<{ file: string }> };

/**
 * Serves locally stored uploads. Files written at runtime aren't picked up
 * from /public by `next start`, so they're streamed from ./uploads instead.
 * The strict name pattern rules out path traversal.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { file } = await params;
  if (!UPLOAD_NAME_RE.test(file)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
