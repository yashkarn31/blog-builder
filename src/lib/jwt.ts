import { SignJWT, jwtVerify } from "jose";

// Kept free of Node/DB imports so it can run inside proxy.ts.

export const SESSION_COOKIE = "bb_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "ADMIN" | "EMPLOYEE";

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub || (payload.role !== "ADMIN" && payload.role !== "EMPLOYEE")) return null;
    return { sub: payload.sub, role: payload.role, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
