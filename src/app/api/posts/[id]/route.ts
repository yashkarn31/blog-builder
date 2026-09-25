import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canEditPost, updatePost } from "@/lib/posts";
import { forbidden, notFound, readJson, requireApiUser, route } from "@/lib/api";
import { postSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function loadEditable(id: string) {
  const user = await requireApiUser();
  const post = await prisma.post.findUnique({
    where: { id },
    include: { tags: { select: { name: true } }, category: { select: { id: true, name: true } } },
  });
  if (!post) throw notFound("Post");
  if (!canEditPost(user, post)) throw forbidden();
  return post;
}

/** Full post (including drafts) for its author or an admin — used by the editor. */
export const GET = route<Ctx>(async (_req, { params }) => {
  const post = await loadEditable((await params).id);
  return NextResponse.json({ post });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const { id } = await params;
  await loadEditable(id);
  const input = postSchema.parse(await readJson(req));
  return NextResponse.json({ post: await updatePost(id, input) });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  await loadEditable(id);
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
