import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ApiError, readJson, requireApiAdmin, route } from "@/lib/api";
import { getUsersWithCounts } from "@/lib/stats";
import { createEmployeeSchema } from "@/lib/validation";

export const GET = route(async () => {
  await requireApiAdmin();
  return NextResponse.json({ users: await getUsersWithCounts() });
});

export const POST = route(async (req) => {
  await requireApiAdmin();
  const { name, email, password, role } = createEmployeeSchema.parse(await readJson(req));
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    throw new ApiError(409, "An account with this email already exists.");
  }
  const user = await prisma.user.create({
    data: { name, email, role, passwordHash: await hashPassword(password) },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json({ user }, { status: 201 });
});
