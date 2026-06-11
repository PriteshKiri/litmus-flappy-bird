import { NextResponse } from "next/server";
import { getScoreMax, getServiceClient } from "@/lib/supabaseServer";
import type { LitmusRelation } from "@/lib/types";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RELATIONS: LitmusRelation[] = ["new_to_litmus", "end_user", "contributor"];

// Normalize a LinkedIn profile to a stable key, e.g. "linkedin.com/in/jane".
// Accepts a full URL, a "linkedin.com/in/..." string, or a bare handle.
function normalizeLinkedIn(raw: string): string {
  let v = raw.trim().toLowerCase();
  if (!v) return "";
  v = v.replace(/^https?:\/\//, "").replace(/^www\./, "");
  v = v.split(/[?#]/)[0].replace(/\/+$/, "");
  // Bare handle -> assume a personal profile path.
  if (!v.includes("linkedin.com")) {
    v = `linkedin.com/in/${v.replace(/^\/+/, "")}`;
  }
  return v;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const name = str(body.name);
  const linkedinRaw = str(body.linkedin);
  const company = str(body.company);
  const cncfProject = str(body.cncfProject);
  const litmusRelation = str(body.litmusRelation) as LitmusRelation;
  const wantsCommunity = body.wantsCommunity === true;
  const email = str(body.email).toLowerCase();
  const score = typeof body.score === "number" ? Math.floor(body.score) : NaN;

  if (!name || name.length > 80) {
    return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 });
  }

  const linkedin = normalizeLinkedIn(linkedinRaw);
  if (!/^linkedin\.com\/.+/.test(linkedin) || linkedin.length < 5) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid LinkedIn profile URL." },
      { status: 400 },
    );
  }

  if (!RELATIONS.includes(litmusRelation)) {
    return NextResponse.json(
      { ok: false, error: "Please select your relationship to LitmusChaos." },
      { status: 400 },
    );
  }

  if (wantsCommunity && !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email to join the community calls." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(score) || score < 0) {
    return NextResponse.json({ ok: false, error: "Invalid score." }, { status: 400 });
  }

  const scoreMax = getScoreMax();
  if (score > scoreMax) {
    return NextResponse.json(
      { ok: false, error: "Score exceeds the allowed maximum." },
      { status: 422 },
    );
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

  const { error } = await supabase.from("scores").insert({
    name,
    linkedin,
    company: company || null,
    cncf_project: cncfProject || null,
    litmus_relation: litmusRelation,
    wants_community: wantsCommunity,
    email: wantsCommunity && email ? email : null,
    score,
  });

  if (error) {
    // 23505 = unique_violation -> this LinkedIn profile already submitted.
    if (error.code === "23505") {
      return NextResponse.json(
        {
          ok: false,
          error: "This LinkedIn profile has already submitted a score. One entry per player.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: "Could not save score. Try again." }, { status: 500 });
  }

  // Rank = number of scores strictly greater than this one, plus 1.
  const { count } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .gt("score", score);

  return NextResponse.json({ ok: true, rank: (count ?? 0) + 1 });
}
