import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notFound, requireApiUser, route } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** Toggles the current user's like on a published post. */
export const POST = route<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const { id: postId } = await params;
  const post = await prisma.post.findFirst({ where: { id: postId, status: "PUBLISHED" }, select: { id: true } });
  if (!post) throw notFound("Post");

  const key = { postId_userId: { postId, userId: user.id } };
  const existing = await prisma.like.findUnique({ where: key });
  if (existing) await prisma.like.delete({ where: key });
  else await prisma.like.create({ data: { postId, userId: user.id } });

  const count = await prisma.like.count({ where: { postId } });
  return NextResponse.json({ liked: !existing, count });
});
