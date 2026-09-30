import "server-only";
import { prisma } from "@/lib/db";

export async function getAdminStats() {
  const [postCounts, views, users, likes, comments, topPosts, perAuthor] = await Promise.all([
    prisma.post.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.like.count(),
    prisma.comment.count(),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, views: true, author: { select: { name: true } } },
    }),
    prisma.post.groupBy({
      by: ["authorId"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
      _sum: { views: true },
      orderBy: { _count: { authorId: "desc" } },
      take: 1,
    }),
  ]);

  const count = (status: string) => postCounts.find((p) => p.status === status)?._count._all ?? 0;
  const mostActive = perAuthor[0]
    ? {
        user: await prisma.user.findUnique({ where: { id: perAuthor[0].authorId }, select: { id: true, name: true } }),
        posts: perAuthor[0]._count._all,
        views: perAuthor[0]._sum.views ?? 0,
      }
    : null;

  return {
    totalPosts: count("PUBLISHED") + count("DRAFT"),
    published: count("PUBLISHED"),
    drafts: count("DRAFT"),
    totalViews: views._sum.views ?? 0,
    employees: users.find((u) => u.role === "EMPLOYEE")?._count._all ?? 0,
    admins: users.find((u) => u.role === "ADMIN")?._count._all ?? 0,
    likes,
    comments,
    topPosts,
    mostActive,
  };
}

/** All users with post counts split by status (admin employee table). */
export async function getUsersWithCounts() {
  const [users, grouped] = await Promise.all([
    prisma.user.findMany({
      // Pending sign-ups first so they're hard to miss.
      orderBy: [{ approved: "asc" }, { role: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, email: true, role: true, active: true, approved: true, createdAt: true },
    }),
    prisma.post.groupBy({ by: ["authorId", "status"], _count: { _all: true }, _sum: { views: true } }),
  ]);
  return users.map((u) => {
    const mine = grouped.filter((g) => g.authorId === u.id);
    const of = (s: string) => mine.find((g) => g.status === s)?._count._all ?? 0;
    return {
      ...u,
      published: of("PUBLISHED"),
      drafts: of("DRAFT"),
      views: mine.reduce((sum, g) => sum + (g._sum.views ?? 0), 0),
    };
  });
}
