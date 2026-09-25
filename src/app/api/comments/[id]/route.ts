import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, notFound, requireApiUser, route } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/** A comment can be removed by its writer, the post's author, or an admin. */
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await requireApiUser();
  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, post: { select: { authorId: true } } },
  });
  if (!comment) throw notFound("Comment");
  const allowed = user.role === "ADMIN" || comment.authorId === user.id || comment.post.authorId === user.id;
  if (!allowed) throw forbidden();

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
