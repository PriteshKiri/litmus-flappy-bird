import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  const authed = store.get(ADMIN_COOKIE)?.value === expectedToken();
  return NextResponse.json({ authed });
}
