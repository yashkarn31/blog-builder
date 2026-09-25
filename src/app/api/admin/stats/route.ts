import { NextResponse } from "next/server";
import { requireApiAdmin, route } from "@/lib/api";
import { getAdminStats } from "@/lib/stats";

export const GET = route(async () => {
  await requireApiAdmin();
  return NextResponse.json(await getAdminStats());
});
