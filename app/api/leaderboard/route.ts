import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import type { LeaderboardEntry, ScoreRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number.parseInt(searchParams.get("limit") ?? "10", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 10;

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
    .select("name, company, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not load leaderboard." }, { status: 500 });
  }

  const entries: LeaderboardEntry[] = (
    data as Pick<ScoreRow, "name" | "company" | "score">[]
  ).map((row, index) => ({
    rank: index + 1,
    name: row.name,
    company: row.company,
    score: row.score,
  }));

  return NextResponse.json(
    { ok: true, entries, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
