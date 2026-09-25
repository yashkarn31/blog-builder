import "server-only";
import { prisma } from "@/lib/db";

export async function getEditorOptions() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.tag.findMany({ orderBy: { posts: { _count: "desc" } }, take: 100, select: { name: true } }),
  ]);
  return { categories, tagSuggestions: tags.map((t) => t.name) };
}
