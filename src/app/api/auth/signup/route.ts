import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { ApiError, readJson, route } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation";
import { signupMode } from "@/lib/signup-mode";

// Self-signup always creates an EMPLOYEE. Admins are created by the seed
// script or promoted by another admin — never via a public endpoint.
export const POST = route(async (req) => {
  const mode = signupMode();
  if (mode === "closed") {
    throw new ApiError(403, "Self-signup is disabled. Ask an admin to create your account.");
  }
  // The per-IP limit is only as trustworthy as the proxy setup (see clientIp).
  if (!rateLimit(`signup:${clientIp(req.headers)}`, 5, 60_000)) {
    throw new ApiError(429, "Too many attempts. Try again in a minute.");
  }
  const { name, email, password } = signupSchema.parse(await readJson(req));

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new ApiError(409, "An account with this email already exists.");
  }
  // Global ceiling that holds even if the IP is spoofed. Checked last so junk
  // or duplicate requests can't use it up and block genuine sign-ups.
  if (!rateLimit("signup:global", 30, 60 * 60_000)) {
    throw new ApiError(429, "Too many sign-ups right now. Try again later.");
  }
  const approved = mode === "open";
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role: "EMPLOYEE", approved },
  });

  if (!approved) {
    return NextResponse.json({ pending: true }, { status: 201 });
  }
  await createSession(user);
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
});
