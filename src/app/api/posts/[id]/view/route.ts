import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { route } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

const VIEWED_COOKIE = "bb_viewed";

/**
 * Called once by the article page after it mounts (so link prefetches and
 * bots that don't run JS aren't counted). A cookie de-duplicates repeat views
 * from the same browser for 12 hours.
 */
export const POST = route<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const seen = (req.cookies.get(VIEWED_COOKIE)?.value ?? "").split(".").filter(Boolean);
  if (seen.includes(id)) return NextResponse.json({ counted: false });

  const { count } = await prisma.post.updateMany({
    where: { id, status: "PUBLISHED" },
    data: { views: { increment: 1 } },
  });

  const res = NextResponse.json({ counted: count > 0 });
  if (count > 0) {
    res.cookies.set(VIEWED_COOKIE, [...seen.slice(-49), id].join("."), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }
  return res;
});
