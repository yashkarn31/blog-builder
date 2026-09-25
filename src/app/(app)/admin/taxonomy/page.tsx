import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export const metadata: Metadata = { title: "Categories & tags · Admin" };

export default async function TaxonomyPage() {
  await requireAdmin();
  const include = { _count: { select: { posts: true } } } as const;
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, include }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, include }),
  ]);
  const rows = (items: typeof categories) =>
    items.map((i) => ({ id: i.id, name: i.name, slug: i.slug, count: i._count.posts }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TaxonomyManager kind="categories" items={rows(categories)} />
      <TaxonomyManager kind="tags" items={rows(tags)} />
    </div>
  );
}
