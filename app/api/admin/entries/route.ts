import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedToken } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabaseServer";
import type { ScoreRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const { data, error } = await supabase
    .from("scores")
    .select("name, company, linkedin, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not load entries." }, { status: 500 });
  }

  const entries = (data as Pick<ScoreRow, "name" | "company" | "linkedin" | "score">[]).map(
    (row, index) => ({
      rank: index + 1,
      name: row.name,
      company: row.company,
      linkedin: row.linkedin,
      score: row.score,
    }),
  );

  return NextResponse.json({ ok: true, entries });
}
