import "server-only";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiError, notFound, readJson, requireApiAdmin, requireApiUser, route } from "@/lib/api";
import { slugify } from "@/lib/slug";
import { taxonomySchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };
type Kind = "category" | "tag";

// Categories and tags have identical shapes; this keeps the two sets of
// route handlers in lock-step.
function delegate(kind: Kind) {
  return (kind === "category" ? prisma.category : prisma.tag) as unknown as typeof prisma.tag;
}

async function assertFree(kind: Kind, name: string, slug: string, ownId?: string) {
  const clash = await delegate(kind).findFirst({
    where: { OR: [{ slug }, { name: { equals: name, mode: "insensitive" } }], NOT: ownId ? { id: ownId } : undefined },
  });
  if (clash) throw new ApiError(409, `A ${kind} named "${clash.name}" already exists.`);
}

export function taxonomyHandlers(kind: Kind) {
  return {
    list: route(async () => {
      await requireApiUser();
      const items = await delegate(kind).findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { posts: true } } },
      });
      return NextResponse.json({ items });
    }),

    create: route(async (req) => {
      await requireApiAdmin();
      const { name } = taxonomySchema.parse(await readJson(req));
      const slug = slugify(name);
      if (!slug) throw new ApiError(400, "Name must contain letters or numbers.");
      await assertFree(kind, name, slug);
      const item = await delegate(kind).create({ data: { name, slug } });
      return NextResponse.json({ item }, { status: 201 });
    }),

    update: route<Ctx>(async (req, { params }) => {
      await requireApiAdmin();
      const { id } = await params;
      const { name } = taxonomySchema.parse(await readJson(req));
      const slug = slugify(name);
      if (!slug) throw new ApiError(400, "Name must contain letters or numbers.");
      if (!(await delegate(kind).findUnique({ where: { id } }))) throw notFound(kind);
      await assertFree(kind, name, slug, id);
      const item = await delegate(kind).update({ where: { id }, data: { name, slug } });
      return NextResponse.json({ item });
    }),

    remove: route<Ctx>(async (_req, { params }) => {
      await requireApiAdmin();
      const { id } = await params;
      if (!(await delegate(kind).findUnique({ where: { id } }))) throw notFound(kind);
      // Posts keep existing: categories are SetNull, tag links are dropped.
      await delegate(kind).delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }),
  };
}
