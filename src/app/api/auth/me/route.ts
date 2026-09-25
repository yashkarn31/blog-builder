import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { route } from "@/lib/api";

export const GET = route(async () => {
  return NextResponse.json({ user: await getCurrentUser() });
});
