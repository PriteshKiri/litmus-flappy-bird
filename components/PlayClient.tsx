"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import FlappyGame from "./FlappyGame";
import type { LitmusRelation } from "@/lib/types";

type Phase = "gate" | "play" | "over" | "done";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PlayClient() {
  const [phase, setPhase] = useState<Phase>("gate");

  // Registration fields
  const [name, setName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [company, setCompany] = useState("");
  const [litmusUsageTeam, setLitmusUsageTeam] = useState("");
  const [wantsAdoptersList, setWantsAdoptersList] = useState(false);
  const [relation, setRelation] = useState<LitmusRelation | "">("");
  const [wantsCommunity, setWantsCommunity] = useState(false);
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const [score, setScore] = useState(0);
  const [runKey, setRunKey] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [rank, setRank] = useState<number | null>(null);

  const startGame = () => {
    setFormError("");
    if (!name.trim()) return setFormError("Please enter your name.");
    if (linkedin.trim().length < 3) return setFormError("Please enter your LinkedIn profile.");
    // Temporarily disabled — only Name and LinkedIn are required for now.
    // if (!relation) return setFormError("Please select your relationship to LitmusChaos.");
    // if (relation === "end_user" && !company.trim())
    //   return setFormError("Please enter your organization name.");
    // if (relation === "end_user" && !litmusUsageTeam.trim())
    //   return setFormError("Please enter the team using LitmusChaos.");
    // if (wantsCommunity && !EMAIL_RE.test(email.trim()))
    //   return setFormError("Please enter a valid email to join the community calls.");
    setRunKey((k) => k + 1);
    setPhase("play");
  };

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setPhase("over");
  }, []);

  const playAgain = () => {
    setSubmitError("");
    setRunKey((k) => k + 1);
    setPhase("play");
  };

  const submitScore = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          linkedin: linkedin.trim(),
          company: relation === "end_user" ? company.trim() : "",
          litmusUsageTeam: relation === "end_user" ? litmusUsageTeam.trim() : "",
          wantsAdoptersList: relation === "end_user" ? wantsAdoptersList : false,
          litmusRelation: relation,
          wantsCommunity,
          email: wantsCommunity ? email.trim() : "",
          score,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRank(data.rank ?? null);
        setPhase("done");
      } else {
        setSubmitError(data.error || "Could not submit. Try again.");
      }
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={shell}>
      <header style={headerBar}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/litmus-bird.png" alt="" width={30} height={30} />
          <strong style={{ fontSize: "0.95rem" }}>Chaos Bird</strong>
        </Link>
        <span className="pill">KubeCon India</span>
      </header>

      {phase === "gate" && (
        <section style={gateScroll}>
          <div className="card" style={{ padding: "1.5rem", width: "100%", maxWidth: 400 }}>
            <h2 style={{ fontSize: "1.4rem", marginBottom: 4 }}>Enter the arena</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
              Register to play. Top the leaderboard to win LitmusChaos swag!
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <Field label="Name *">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="LinkedIn profile *" hint="Used to keep entries unique — one per person.">
                <input
                  type="text"
                  placeholder="linkedin.com/in/your-handle"
                  value={linkedin}
                  autoCapitalize="none"
                  autoCorrect="off"
                  onChange={(e) => setLinkedin(e.target.value)}
                />
              </Field>

              <Field label="GitHub username" hint="So we can welcome you to the community.">
                <input
                  type="text"
                  placeholder="your-github-handle"
                  value={github}
                  autoCapitalize="none"
                  autoCorrect="off"
                  onChange={(e) => setGithub(e.target.value)}
                />
              </Field>

              <a
                href="https://github.com/litmuschaos/litmus"
                target="_blank"
                rel="noopener noreferrer"
                style={starCallout}
              >
                <span style={{ fontSize: "0.95rem", fontWeight: 800 }}>
                  ⭐ Star LitmusChaos on GitHub
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                  github.com/litmuschaos/litmus — show some love!
                </span>
              </a>

              {/* Temporarily hidden — only Name and LinkedIn are collected for now.
                  We'll bring these fields back later.

              <Field label="Relationship to LitmusChaos *">
                <select value={relation} onChange={(e) => setRelation(e.target.value as LitmusRelation)}>
                  <option value="">Select one…</option>
                  <option value="new_to_litmus">New to Litmus</option>
                  <option value="end_user">End user</option>
                  <option value="contributor">Contributor</option>
                </select>
              </Field>

              {relation === "end_user" && (
                <>
                  <Field label="Organization name *">
                    <input
                      type="text"
                      placeholder="Your organization"
                      value={company}
                      maxLength={120}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </Field>
                  <Field label="Team using LitmusChaos *">
                    <input
                      type="text"
                      placeholder="Platform, SRE, DevOps, etc."
                      value={litmusUsageTeam}
                      maxLength={120}
                      onChange={(e) => setLitmusUsageTeam(e.target.value)}
                    />
                  </Field>
                  <label style={toggleRow}>
                    <input
                      type="checkbox"
                      checked={wantsAdoptersList}
                      onChange={(e) => setWantsAdoptersList(e.target.checked)}
                    />
                    <span>We&apos;d like to be part of the LitmusChaos adopters list</span>
                  </label>
                </>
              )}

              <p style={communityPrompt}>
                Want to learn Litmus? Join the LitmusChaos community calls.
              </p>
              <label style={toggleRow}>
                <input
                  type="checkbox"
                  checked={wantsCommunity}
                  onChange={(e) => setWantsCommunity(e.target.checked)}
                />
                <span>Join the LitmusChaos community calls</span>
              </label>
              {wantsCommunity && (
                <Field hint="We'll send an invite to the monthly community & contributor meetings.">
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    autoCapitalize="none"
                    autoCorrect="off"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              )}
              */}

              {formError && <p style={errorText}>{formError}</p>}
              <button className="btn btn-primary" onClick={startGame} style={{ marginTop: 4 }}>
                ▶ Start game
              </button>
            </div>
          </div>
          <p style={noteText}>
            You can retry as many times as you like — but you can submit a score only once per LinkedIn.
          </p>
        </section>
      )}

      {phase === "play" && (
        <section style={gameWrap}>
          <FlappyGame key={runKey} onGameOver={handleGameOver} onScore={setScore} />
        </section>
      )}

      {phase === "over" && (
        <section style={panel}>
          <div className="card" style={{ padding: "1.75rem", width: "100%", maxWidth: 380, textAlign: "center" }}>
            <p className="pill" style={{ marginBottom: 12 }}>Game over</p>
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Your score</div>
            <div style={{ fontSize: "3.6rem", fontWeight: 800, lineHeight: 1, margin: "0.2rem 0 1.2rem" }}>
              {score}
            </div>
            <div style={announceCallout}>
              <span style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--gold)" }}>
                Winner announced at 4:04 PM
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                Keep trying until then!!
              </span>
            </div>
            {submitError && <p style={errorText}>{submitError}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <button className="btn btn-primary" onClick={submitScore} disabled={submitting}>
                {submitting ? "Submitting…" : "✓ Submit score"}
              </button>
              <button className="btn btn-secondary" onClick={playAgain} disabled={submitting}>
                ↻ Play again
              </button>
            </div>
            <p style={{ ...noteText, marginTop: "1rem" }}>
              Submitting locks your entry to your LinkedIn. Choose your best run!
            </p>
          </div>
        </section>
      )}

      {phase === "done" && (
        <section style={panel}>
          <div className="card" style={{ padding: "1.75rem", width: "100%", maxWidth: 380, textAlign: "center" }}>
            <Image src="/litmus-bird.png" alt="" width={90} height={90} />
            <h2 style={{ fontSize: "1.5rem", margin: "0.5rem 0 0.25rem" }}>Score submitted!</h2>
            <p style={{ color: "var(--text-dim)" }}>
              You scored <strong style={{ color: "var(--text)" }}>{score}</strong>
              {rank ? (
                <>
                  {" "}— currently rank <strong style={{ color: "var(--bird-yellow)" }}>#{rank}</strong>
                </>
              ) : null}
              .
            </p>
            {wantsCommunity && (
              <p style={{ ...noteText, marginTop: 10 }}>
                🎉 You&apos;re on the list — watch your inbox for the community call invite.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginTop: "1.25rem" }}>
              <Link href="/leaderboard" className="btn btn-primary">
                🏆 View leaderboard
              </Link>
            </div>
            <p style={{ ...noteText, marginTop: "1rem" }}>
              Watch the big screen — refresh to see if you made the top!
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <span style={fieldLabel}>{label}</span>}
      {children}
      {hint && <span style={fieldHint}>{hint}</span>}
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
};

const headerBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.85rem 1.1rem",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const gateScroll: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.9rem",
  padding: "1.5rem 1.25rem 2rem",
  overflowY: "auto",
};

const panel: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.9rem",
  padding: "1.25rem",
};

const gameWrap: React.CSSProperties = {
  flex: 1,
  position: "relative",
  margin: "0.75rem",
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
};

const communityPrompt: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--litmus-purple-light)",
  marginTop: "0.35rem",
};

const toggleRow: React.CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  alignItems: "center",
  fontSize: "0.9rem",
  color: "var(--text)",
  cursor: "pointer",
  padding: "0.2rem 0",
};

const fieldLabel: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "var(--text-dim)",
  letterSpacing: "0.02em",
};

const fieldHint: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "rgba(184,174,224,0.7)",
};

const errorText: React.CSSProperties = {
  color: "var(--bad)",
  fontSize: "0.85rem",
  margin: "0.2rem 0",
};

const noteText: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "0.76rem",
  textAlign: "center",
  maxWidth: 360,
};

const starCallout: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  padding: "0.8rem 1rem",
  borderRadius: 12,
  textDecoration: "none",
  color: "var(--text)",
  background: "rgba(255,210,74,0.06)",
  border: "1px solid rgba(255,210,74,0.28)",
  marginTop: "0.35rem",
};

const announceCallout: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  padding: "0.8rem 1rem",
  borderRadius: 12,
  marginBottom: "1rem",
  background: "rgba(255,210,74,0.06)",
  border: "1px solid rgba(255,210,74,0.28)",
};
