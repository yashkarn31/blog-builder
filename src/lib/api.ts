import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const unauthorized = () => new ApiError(401, "You need to be logged in.");
export const forbidden = () => new ApiError(403, "You don't have permission to do that.");
export const notFound = (what = "Resource") => new ApiError(404, `${what} not found.`);

export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireApiAdmin(): Promise<CurrentUser> {
  const user = await requireApiUser();
  if (user.role !== "ADMIN") throw forbidden();
  return user;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Basic CSRF defence on top of SameSite=Lax cookies: state-changing requests
 * must come from our own origin.
 */
function assertSameOrigin(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (curl, server-to-server)
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host || new URL(origin).host !== host) {
    throw new ApiError(403, "Cross-origin request rejected.");
  }
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Wraps a route handler with origin checks and uniform JSON error responses. */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: err.issues[0]?.message ?? "Invalid input", issues: err.issues },
          { status: 400 },
        );
      }
      console.error(err);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}
