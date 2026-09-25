/**
 * Seeds an admin, two employees, categories and the three sample posts from
 * the assignment brief. Safe to re-run: users/categories are upserted and the
 * sample posts are recreated.
 *
 *   npm run db:seed                 # everything
 *   SEED_POSTS=false npm run db:seed  # accounts + categories only (write posts yourself in the builder)
 */
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { makeExcerpt, readingTime, sanitizeContent } from "../src/lib/content";
import { slugify } from "../src/lib/slug";
import { analyticsCover, developerCover, habitsCover } from "./seed-assets/covers";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DAY = 86_400_000;

async function renderCover(svg: string, slug: string) {
  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  const name = `seed-${slug}.webp`;
  await writeFile(path.join(dir, name), await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer());
  return `/uploads/${name}`;
}

async function upsertUser(data: { name: string; email: string; password: string; role: "ADMIN" | "EMPLOYEE"; bio?: string }) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.user.upsert({
    where: { email: data.email },
    update: { name: data.name, role: data.role, bio: data.bio, active: true, passwordHash },
    create: { name: data.name, email: data.email, role: data.role, bio: data.bio, passwordHash },
  });
}

const POSTS = [
  {
    title: "The Future of Data Analytics: What Every Business Should Know in 2026",
    category: "Data & Analytics",
    tags: ["analytics", "business intelligence", "data trends"],
    cover: analyticsCover,
    author: "aarav",
    status: "PUBLISHED" as const,
    publishedDaysAgo: 3,
    views: 342,
    content: `
<blockquote><p>Data used to be something companies collected. Today, it's something companies <em>think</em> with.</p></blockquote>
<p>The shift from reactive reporting to real-time, predictive analytics has changed how businesses make decisions. A decade ago, most companies looked at last month's numbers to plan next quarter. Now, dashboards update by the second, and AI models forecast outcomes before a trend even fully forms.</p>
<h2>1. From Descriptive to Predictive</h2>
<p>Traditional analytics answered "what happened?" Modern analytics answers "what's likely to happen next?" — and increasingly, "what should we do about it?" Predictive models are now embedded directly into everyday tools, not just specialist software.</p>
<h2>2. Democratization of Data</h2>
<p>You no longer need a data science degree to explore data. No-code dashboards and natural-language query tools mean a marketing manager can ask "which campaign drove the most signups last week?" and get an instant, visual answer.</p>
<h2>3. The Rise of Real-Time Decisioning</h2>
<p>Batch reports run overnight are being replaced by streaming analytics — useful for fraud detection, inventory management, and customer experience personalization, where a delay of even a few hours can mean lost revenue.</p>
<h2>4. Privacy-First Analytics</h2>
<p>With tightening data regulations globally, businesses are investing in privacy-preserving analytics — aggregated insights without exposing individual user data. This isn't just compliance; it's becoming a trust differentiator.</p>
<hr>
<p><strong>Takeaway:</strong> Companies that treat analytics as a core decision-making layer — not just a reporting function — are the ones that will move faster and smarter in the years ahead.</p>`,
  },
  {
    title: "Why Full-Stack Developers Are More Valuable Than Ever",
    category: "Careers & Tech",
    tags: ["full-stack development", "hiring", "software careers"],
    cover: developerCover,
    author: "neha",
    status: "PUBLISHED" as const,
    publishedDaysAgo: 1,
    views: 218,
    content: `
<blockquote><p>A good full-stack developer isn't someone who knows a little of everything — it's someone who knows <em>enough</em> of everything to build something that actually works, end to end.</p></blockquote>
<h2>1. Startups Need Builders, Not Specialists (At First)</h2>
<p>Early-stage companies rarely have the luxury of ten specialized engineers. They need people who can design a database schema in the morning and fix a CSS bug in the afternoon. Full-stack developers fill that gap.</p>
<h2>2. The Modern Stack Has Gotten More Unified</h2>
<p>With frameworks like Next.js blurring the line between frontend and backend, and tools like Prisma simplifying database work, it's genuinely easier than it used to be for one person to own a feature from UI to API to database.</p>
<h2>3. Faster Iteration, Fewer Handoffs</h2>
<p>When one person understands the whole flow of a feature, there's less back-and-forth between teams. Bugs get fixed faster because there's no "that's not my part of the stack" excuse.</p>
<h2>4. What Companies Actually Look For</h2>
<p>Beyond just knowing React and Node, companies increasingly value full-stack developers who understand:</p>
<ul>
<li><p>Basic system design and API structuring</p></li>
<li><p>Authentication and security fundamentals</p></li>
<li><p>Deployment and debugging in production</p></li>
<li><p>Writing clean, readable, and testable code</p></li>
</ul>
<hr>
<p><strong>Takeaway:</strong> Full-stack development isn't about being a jack-of-all-trades and master of none — it's about being able to take an idea from concept to a working, deployed product. That skill only becomes more valuable as teams stay lean and timelines get tighter.</p>`,
  },
  {
    title: "5 Small Habits That Make You a Better Developer",
    category: "Productivity",
    tags: ["developer habits", "productivity", "coding tips"],
    cover: habitsCover,
    author: "aarav",
    // Left as a draft so the draft → publish flow can be demoed.
    status: "DRAFT" as const,
    publishedDaysAgo: 0,
    views: 0,
    content: `
<ol>
<li><p><strong>Read code more than you write it.</strong> Reviewing others' code — even messy code — teaches you patterns and anti-patterns faster than tutorials do.</p></li>
<li><p><strong>Write commit messages like someone else will read them.</strong> Because they will — including future you.</p></li>
<li><p><strong>Google the error message, not the whole problem.</strong> Specific errors lead to specific answers.</p></li>
<li><p><strong>Refactor in small steps.</strong> Big rewrites break things; small, tested changes don't.</p></li>
<li><p><strong>Take breaks before you're stuck for an hour.</strong> A 10-minute walk often solves what an hour of staring at the screen won't.</p></li>
</ol>
<p>None of these habits require extra time in your day — they just require a small shift in how you already work.</p>`,
  },
];

async function main() {
  console.log("Seeding users…");
  const admin = await upsertUser({
    name: "Riya Kapoor",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@analyticsliv.com",
    password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@123",
    role: "ADMIN",
    bio: "Runs the team blog and keeps the lights on.",
  });
  const aarav = await upsertUser({
    name: "Aarav Mehta",
    email: "aarav@analyticsliv.com",
    password: "Writer@123",
    role: "EMPLOYEE",
    bio: "Analytics engineer. Turns messy event data into decisions.",
  });
  const neha = await upsertUser({
    name: "Neha Sharma",
    email: "neha@analyticsliv.com",
    password: "Writer@123",
    role: "EMPLOYEE",
    bio: "Full-stack developer who enjoys owning features end to end.",
  });
  const authors = { aarav, neha };

  console.log("Seeding categories…");
  const categories = ["Data & Analytics", "Careers & Tech", "Productivity", "Engineering", "Design & UX"];
  for (const name of categories) {
    await prisma.category.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });
  }

  if (process.env.SEED_POSTS === "false") {
    console.log("Skipping sample posts (SEED_POSTS=false).");
    return;
  }

  console.log("Seeding sample posts…");
  for (const p of POSTS) {
    const slug = slugify(p.title);
    await prisma.post.deleteMany({ where: { slug } });
    const content = sanitizeContent(p.content.trim());
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: slugify(p.category) } });
    const post = await prisma.post.create({
      data: {
        title: p.title,
        slug,
        content,
        excerpt: makeExcerpt(content),
        readingTime: readingTime(content),
        coverImage: await renderCover(p.cover, slug),
        status: p.status,
        views: p.views,
        publishedAt: p.status === "PUBLISHED" ? new Date(Date.now() - p.publishedDaysAgo * DAY) : null,
        authorId: authors[p.author as keyof typeof authors].id,
        categoryId: category.id,
        tags: { connectOrCreate: p.tags.map((name) => ({ where: { slug: slugify(name) }, create: { name, slug: slugify(name) } })) },
      },
    });

    if (p.status === "PUBLISHED") {
      const others = [admin, aarav, neha].filter((u) => u.id !== post.authorId);
      await prisma.like.createMany({ data: others.map((u) => ({ postId: post.id, userId: u.id })) });
      await prisma.comment.create({
        data: {
          postId: post.id,
          authorId: others[0].id,
          body:
            p.author === "aarav"
              ? "Great overview. The point about privacy-first analytics becoming a trust differentiator really resonates with what we hear from clients."
              : "Agree with all of this — especially fewer handoffs. Owning a feature end to end makes debugging so much faster.",
        },
      });
    }
    console.log(`  ✓ ${p.status.toLowerCase().padEnd(9)} ${p.title}`);
  }
}

main()
  .then(() => console.log("Done."))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
