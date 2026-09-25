import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, notFound, readJson, requireApiUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { commentSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const;

export const GET = route<Ctx>(async (_req, { params }) => {
  const { id: postId } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId, post: { status: "PUBLISHED" } },
    select: commentSelect,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ comments });
});

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireApiUser();
  if (!rateLimit(`comment:${user.id}`, 10, 60_000)) {
    throw new ApiError(429, "You're commenting too fast. Take a breath.");
  }
  const { id: postId } = await params;
  const { body } = commentSchema.parse(await readJson(req));

  const post = await prisma.post.findFirst({ where: { id: postId, status: "PUBLISHED" }, select: { id: true } });
  if (!post) throw notFound("Post");

  const comment = await prisma.comment.create({
    data: { body, postId, authorId: user.id },
    select: commentSelect,
  });
  return NextResponse.json({ comment }, { status: 201 });
});
