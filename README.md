# Inkwell — Blog Builder Platform

A small, in-house Medium/Dev.to for the AnalyticsLiv team. **Admins** manage people, topics and every post; **employees** write, save drafts and publish their own posts; **readers** get a clean, fast, readable public blog.

Built with **Next.js 16 (App Router)** end to end. The backend is Next.js Route Handlers, with no separate Express server.

> Demo accounts (created by the seed script)
>
> | Role     | Email                    | Password     |
> | -------- | ------------------------ | ------------ |
> | Admin    | `admin@analyticsliv.com` | `Admin@123`  |
> | Employee | `aarav@analyticsliv.com` | `Writer@123` |
> | Employee | `neha@analyticsliv.com`  | `Writer@123` |

---

## Quick start

**Requirements:** Node.js ≥ 20.9 and a PostgreSQL database (local install, Docker, or a hosted one such as Neon/Supabase).

```bash
# 1. Install dependencies (this also generates the Prisma client)
npm install

# 2. Configure environment
cp .env.example .env
#    then edit DATABASE_URL and set JWT_SECRET (e.g. `openssl rand -hex 32`)

# 3. Create the schema
npm run db:deploy        # or `npm run db:migrate` while developing

# 4. Seed demo users, categories and the three sample posts
npm run db:seed

# 5. Run it
npm run dev              # http://localhost:3000
```

Postgres via Docker, if you don't have one installed:

```bash
docker run -d --name blog-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=blog_builder -p 5432:5432 postgres:16
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blog_builder?schema=public"
```

Production build: `npm run build && npm start`.

### Useful scripts

| Script               | What it does                                                   |
| -------------------- | -------------------------------------------------------------- |
| `npm run dev`        | Dev server                                                     |
| `npm run build`      | Production build (type-checks too)                             |
| `npm run lint`       | ESLint                                                         |
| `npm run typecheck`  | `tsc --noEmit`                                                 |
| `npm run db:migrate` | Create/apply migrations in development                        |
| `npm run db:deploy`  | Apply existing migrations (CI / production)                    |
| `npm run db:seed`    | Seed users, categories, sample posts (safe to re-run)          |
| `npm run db:reset`   | Drop and recreate the database, then seed                      |
| `npm run db:studio`  | Browse the data in Prisma Studio                               |

`SEED_POSTS=false npm run db:seed` seeds only the accounts and categories, so you can publish the sample posts yourself through the builder.

### Environment variables

| Variable              | Required | Description                                                        |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`        | ✅       | PostgreSQL connection string                                       |
| `JWT_SECRET`          | ✅       | ≥ 32 characters, used to sign session tokens                       |
| `ALLOW_SIGNUP`        |          | `false` turns off public sign-up (admins can still add people)     |
| `SHOW_DEMO_ACCOUNTS`  |          | `false` hides the one-click demo-account buttons on the login page |
| `SEED_ADMIN_EMAIL`    |          | Admin email for the seed script                                    |
| `SEED_ADMIN_PASSWORD` |          | Admin password for the seed script                                 |
| `NEXT_PUBLIC_SITE_URL`|          | Absolute site URL for Open Graph metadata                          |

---

## Tech stack and why

| Layer        | Choice                                                          | Why                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | **Next.js 16, App Router, TypeScript**                          | Required by the brief. Server Components read the DB directly for fast, SEO-friendly public pages, and Route Handlers are the backend for every mutation.                                                              |
| Styling      | **Tailwind CSS v4** + `@tailwindcss/typography`                 | Fast to iterate. The typography plugin gives a solid base for long-form content, and I tuned it with a serif reading face.                                                                                            |
| Database     | **PostgreSQL + Prisma 7**                                       | The data is relational (users → posts ↔ tags, likes, comments), so a relational DB fits naturally. Prisma gives typed queries and versioned migrations. Postgres' `ILIKE` covers search.                              |
| Auth         | **Custom JWT (`jose`) in an httpOnly cookie + `bcryptjs`**      | Just two roles and email/password, so NextAuth would be more machinery than needed. `jose` also works in the Proxy (middleware) layer.                                                                                |
| Editor       | **TipTap 3** (ProseMirror)                                      | Headless, so it matches the site's design. Produces clean semantic HTML and supports headings, lists, links, images, code blocks and Markdown shortcuts.                                                             |
| File storage | **Local disk via a Route Handler**, optimised with **sharp**    | No external account needed to run the project. Every upload is re-encoded, so swapping in S3 or Cloudinary means changing one function (`src/lib/uploads.ts`).                                                       |
| Validation   | **Zod**                                                          | One schema per payload, shared by every Route Handler.                                                                                                                                                                  |
| Sanitising   | **sanitize-html**                                               | Post HTML is allow-list sanitised on write, so the stored HTML is safe to render.                                                                                                                                       |

---

## Features

### ✅ Implemented (all must-haves)

**Auth and roles**

- Sign up and log in with email and password. Passwords are hashed with bcrypt (cost 12).
- JWT session in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). Tokens last 7 days.
- Two roles, **Admin** and **Employee**. Public sign-up always creates an Employee. Admins come from the seed script or are promoted by another admin.
- `src/proxy.ts` redirects signed-out users away from `/dashboard` and `/admin`, and non-admins away from `/admin`.
- Every page and API handler then re-checks the user against the database. Deactivating, deleting or demoting someone takes effect on their next request, even if their JWT hasn't expired.

**Blog builder (editor)**

- Rich-text editing: H2/H3, bold, italic, underline, strikethrough, inline code, links, bullet and numbered lists, quotes, code blocks with syntax highlighting, dividers, images, undo/redo.
- Markdown shortcuts work too (`## `, `- `, `1. `, `> `, ` ``` `).
- Images: upload from the toolbar, or drag-drop or paste them straight into the text.
- Cover image upload (drop or browse) with replace and remove.
- Category picker, plus a tag input with autocomplete from existing tags. New tags are created on the fly, up to 10 per post.
- Save as draft, publish and unpublish. Published posts have an explicit **Update** button, so a half-finished edit never goes live.
- Slugs are generated from the title and kept unique (`-2`, `-3`, …). You can edit a slug by hand. Once a post is published its URL stays stable even if you retitle it.
- Optional custom excerpt. Without one, the excerpt is generated from the body.
- Live word count and reading time. `⌘/Ctrl + S` saves. The browser warns you before leaving with unsaved changes.

**Public blog**

- Homepage with a featured latest post and a responsive card grid. Each card shows the cover, category, title, excerpt, author, date, read time, likes and comments.
- Full-text search (title, excerpt, body, tags, author) with a debounced box. The query lives in the URL, so results can be shared.
- Filter by category (chips) and by tag (popular tags, or any tag on a post), with pagination.
- Article page designed for reading:
  - Newsreader serif at about 20px with a comfortable line length (about 70–75 characters).
  - Large display title, pull-quote styling and syntax-highlighted code.
  - A reading-progress bar, author card, tags, "Keep reading" suggestions and Open Graph/SEO metadata.
- Drafts are hidden from the public. Their author and admins get a preview with a "Draft" banner.
- Fully responsive from 375px phones to desktop, with no horizontal scroll.

**Admin dashboard (`/admin`)**

- **Overview:** total, published and draft posts, total views, likes and comments. Also shows the **most active employee**, a posts-by-author bar chart and the top posts by views.
- **Employees:** every account with published and draft counts, views and join date. Admins can:
  - add an employee or admin
  - deactivate or reactivate an account (keeps their posts, blocks login)
  - promote or demote
  - reset a password
  - delete permanently (cascades to that person's content)
  - Guards stop an admin from deactivating, demoting or deleting their own account.
- **All posts:** filter and search across everyone's posts, then edit, preview, publish/unpublish or delete any of them.
- **Categories and tags:** create, rename and delete, with post counts. Deleting a category leaves its posts uncategorised rather than deleting them.

**Employee dashboard (`/dashboard`)**

- Your own stats (published, drafts, views, likes), plus your posts with status tabs and search. Actions: edit, preview, publish/unpublish, delete.
- Employees can only see and change their own posts. Anyone else's post returns 403 from the API and 404 in the UI.

### ✅ Bonus features

- **Reading-time estimate:** 220 wpm, shown on cards, articles and in the editor.
- **Likes:** toggle with an optimistic update.
- **Comments:** they can be deleted by the comment's writer, the post's author or an admin.
- **Pagination** on the homepage and `GET /api/posts`.
- **Dark mode:** follows the system setting by default, with a toggle and no flash on load.
- **Draft auto-save:** 2 seconds after you stop typing. A brand-new post becomes a draft on its first save, and saves are queued so an auto-save can't race a publish.
- **Image optimisation on upload:**
  - sharp checks the bytes really are an image (it ignores the client's MIME type).
  - It auto-rotates, strips metadata, resizes to at most 1600px wide and re-encodes as WebP (q80).
  - `next/image` then serves responsive AVIF/WebP versions.
- **View counter:** counted by a client beacon after render, so link prefetches and bots aren't counted. A cookie de-duplicates repeat views from the same browser for 12 hours.

### Security notes

- bcrypt password hashing, and a constant-time-ish login: unknown emails still run a bcrypt compare.
- Server-side authorisation on every mutating route, via the `requireApiUser` / `requireApiAdmin` helpers and `canEditPost`.
- **Stored-XSS protection:**
  - Editor HTML goes through an allow-list sanitiser: no scripts, event handlers, `style`, `javascript:` URLs or foreign attributes.
  - Links get `rel="noopener noreferrer nofollow"`.
  - Images must be `https://` or our own `/uploads/`.
- **CSRF:** `SameSite=Lax` cookies, plus an `Origin` check on all state-changing API requests.
- Zod validation on every input, with length limits everywhere.
- In-memory rate limiting on login, sign-up, comments and uploads.
- **Uploads:**
  - Limited to 8 MB and re-encoded.
  - Stored under random names outside `public/`.
  - Served by a handler that only accepts `[a-z0-9-]+.webp`, so path traversal isn't possible.
  - Sent with `nosniff`.
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- A `?next=` redirect after login is only followed if it's a same-site relative path.

### ⏭️ Skipped or partial

- **Cloud file storage (S3/Cloudinary).** Files go to local disk. This works with `next start` on one server, but not on serverless hosts like Vercel, whose filesystem is temporary. See the limitations below.
- **Email flows** (verification, forgot password). Admins reset passwords from the Employees screen instead.
- **Comment moderation queue and nested replies.** Comments are flat and appear instantly.
- **Automated tests.** I verified behaviour by hand and with scripted API checks (roles, ownership, XSS payloads, uploads, CSRF), but the repo has no test suite yet.

---

## Project structure

```
prisma/
  schema.prisma            # User, Post, Category, Tag, Like, Comment
  migrations/              # versioned SQL migrations
  seed.ts                  # demo users, categories, the 3 sample posts
  seed-assets/covers.ts    # SVG artwork rendered to WebP cover images
src/
  proxy.ts                 # route protection (Next 16's renamed middleware)
  app/
    (site)/                # public site: home, /blog/[slug], /login, /signup
    (app)/dashboard/       # employee area + editor (new / [id]/edit)
    (app)/admin/           # overview, employees, all posts, categories & tags
    api/                   # Route Handlers: auth, posts, likes, comments, uploads, taxonomy, admin
    uploads/[file]/        # serves optimised uploads from ./uploads
  components/
    blog/  editor/  dashboard/  admin/  auth/  layout/  ui/
  lib/
    auth.ts  jwt.ts        # sessions, password hashing, current-user lookup
    api.ts                 # route wrapper: errors, origin check, auth guards
    posts.ts               # post create/update rules, listing & search
    content.ts             # sanitising, excerpts, reading time
    validation.ts          # Zod schemas
    uploads.ts             # sharp pipeline
    stats.ts  taxonomy.ts  highlight.ts  slug.ts  rate-limit.ts
```

### API overview

| Method           | Route                        | Who                   |
| ---------------- | ---------------------------- | --------------------- |
| POST             | `/api/auth/signup`, `/login`, `/logout` | public     |
| GET              | `/api/auth/me`               | any                   |
| GET              | `/api/posts?q&category&tag&page` | public            |
| POST             | `/api/posts`                 | logged in             |
| GET/PATCH/DELETE | `/api/posts/:id`             | author or admin       |
| POST             | `/api/posts/:id/like`        | logged in             |
| GET/POST         | `/api/posts/:id/comments`    | public / logged in    |
| POST             | `/api/posts/:id/view`        | public                |
| DELETE           | `/api/comments/:id`          | commenter, post author, admin |
| POST             | `/api/uploads`               | logged in             |
| GET/POST         | `/api/categories`, `/api/tags` | logged in / admin   |
| PATCH/DELETE     | `/api/categories/:id`, `/api/tags/:id` | admin       |
| GET/POST         | `/api/admin/users`           | admin                 |
| PATCH/DELETE     | `/api/admin/users/:id`       | admin                 |
| GET              | `/api/admin/stats`           | admin                 |

---

## Known limitations

- **Uploads live on local disk (`./uploads`).**
  - Fine for `next start` on one VM or container.
  - On Vercel or other serverless hosts, files vanish between invocations. Swap `saveImage()` for an S3 or Cloudinary upload there.
  - Deleting a post or cover image doesn't delete the file yet, so orphans can build up.
- **Rate limiting is in memory,** so it's per process and resets on restart. A multi-instance deployment should use Redis or similar.
- **Search** uses `ILIKE` across columns. That's plenty for hundreds of posts. At scale I'd switch to Postgres full-text search (`tsvector` + GIN index) and add ranking.
- **Sessions can't be revoked individually** without a session table. Deactivating or deleting a user does lock them out immediately, because every request re-reads the user.
- The **view counter** is a simple per-browser count, not unique-visitor analytics.
- **Seed data:** the sample posts come with demo engagement (a few views, likes and a comment) so the stats screens aren't empty. Run with `SEED_POSTS=false` to start clean.

## What I'd improve with more time

1. Move media to S3 or Cloudinary with signed uploads, and clean up unused images.
2. Add a test suite: Vitest for `lib/` (sanitiser, slugs, permissions) and Playwright for the admin, employee and reader journeys, run in CI.
3. Switch to Postgres full-text search with ranking and highlighted snippets. Add an RSS feed and a sitemap.
4. Editorial workflow: scheduled publishing, revision history and "submit for review" before publish.
5. Email verification and self-service password reset. Optionally SSO with Google Workspace.
