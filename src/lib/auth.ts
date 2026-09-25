import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type Role } from "@/lib/jwt";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: { id: string; role: Role; name: string }) {
  const token = await signSession({ sub: user.id, role: user.role, name: user.name });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Resolves the logged-in user. The JWT is verified and the user is re-read from
 * the database so that deleted/deactivated accounts and role changes take
 * effect immediately. Memoised per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  if (!user || !user.active) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

/** For server components: redirect to login when not authenticated. */
export async function requireUser(nextPath = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
