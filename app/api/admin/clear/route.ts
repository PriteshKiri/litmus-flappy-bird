import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST() {
  const store = await cookies();
  if (store.get(ADMIN_COOKIE)?.value !== expectedToken()) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Server not configured. Set Supabase env vars in .env.local." },
      { status: 503 },
    );
  }

  // Delete every row. supabase-js requires a filter, so match all scores >= 0.
  const { error, count } = await supabase
    .from("scores")
    .delete({ count: "exact" })
    .gte("score", 0);

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not clear data." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
