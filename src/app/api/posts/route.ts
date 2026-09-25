import { NextResponse } from "next/server";
import { listPublishedPosts, createPost } from "@/lib/posts";
import { readJson, requireApiUser, route } from "@/lib/api";
import { postListQuerySchema, postSchema } from "@/lib/validation";

/** Public: published posts with search, category/tag filters and pagination. */
export const GET = route(async (req) => {
  const query = postListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return NextResponse.json(await listPublishedPosts(query));
});

/** Any logged-in user can create a post; it is always owned by them. */
export const POST = route(async (req) => {
  const user = await requireApiUser();
  const input = postSchema.parse(await readJson(req));
  const post = await createPost(user, input);
  return NextResponse.json({ post }, { status: 201 });
});
