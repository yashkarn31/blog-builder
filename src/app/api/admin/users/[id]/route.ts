import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ApiError, notFound, readJson, requireApiAdmin, route } from "@/lib/api";
import { updateUserSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function loadTarget(id: string) {
  const admin = await requireApiAdmin();
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) throw notFound("User");
  return { admin, target };
}

/** Rename, change role, (de)activate or reset the password of an account. */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const { admin } = await loadTarget(id);
  const input = updateUserSchema.parse(await readJson(req));

  if (id === admin.id && (input.active === false || input.role === "EMPLOYEE")) {
    throw new ApiError(400, "You can't deactivate or demote your own account.");
  }
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      role: input.role,
      active: input.active,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  });
  return NextResponse.json({ user });
});

/** Permanently removes an account together with its posts, likes and comments. */
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const { admin } = await loadTarget(id);
  if (id === admin.id) throw new ApiError(400, "You can't delete your own account.");
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
