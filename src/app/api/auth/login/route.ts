import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { ApiError, readJson, route } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

// Compared against when the email is unknown so response timing doesn't
// reveal which accounts exist.
const DUMMY_HASH = "$2b$12$d6MEac7g5THMYuvmYFlCnuXPHVxym8K2dQgGnrjEe8UthKufAF0RS";

export const POST = route(async (req) => {
  if (!rateLimit(`login:${clientIp(req.headers)}`, 10, 60_000)) {
    throw new ApiError(429, "Too many login attempts. Try again in a minute.");
  }
  const { email, password } = loginSchema.parse(await readJson(req));

  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, "Invalid email or password.");
  if (!user.active) throw new ApiError(403, "This account has been deactivated. Contact an admin.");

  await createSession(user);
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
});
