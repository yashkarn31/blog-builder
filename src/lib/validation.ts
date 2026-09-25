import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");
const name = z.string().trim().min(2, "Name must be at least 2 characters").max(80);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export const signupSchema = z.object({ name, email, password });

export const createEmployeeSchema = z.object({
  name,
  email,
  password,
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
});

export const updateUserSchema = z
  .object({
    name: name.optional(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
    active: z.boolean().optional(),
    password: password.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

// Every field is optional: creates fill in defaults in lib/posts.ts, and
// updates only touch what was sent. (No `.default()` here — in Zod 4 defaults
// still apply inside `.partial()`, which would silently wipe fields on PATCH.)
export const postSchema = z
  .object({
    title: z.string().trim().max(160, "Title is too long"),
    slug: z.string().trim().max(90),
    excerpt: z.string().trim().max(300, "Excerpt is too long"),
    content: z.string().max(500_000, "Post is too long"),
    coverImage: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === "" || /^(\/uploads\/|https:\/\/)/.test(v), "Cover must be an uploaded image or https URL")
      .nullable(),
    categoryId: z.string().trim().max(40).nullable(),
    tags: z.array(z.string().trim().min(1).max(40)).max(10, "Use at most 10 tags"),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .partial();

export const taxonomySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment can't be empty").max(2000, "Comment is too long"),
});

export const postListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(90).optional(),
  tag: z.string().trim().max(90).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
