"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type View = "loading" | "login" | "dashboard";

interface AdminEntry {
  rank: number;
  name: string;
  company: string | null;
  linkedin: string;
  score: number;
}

export default function AdminClient() {
  const [view, setView] = useState<View>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  const [entries, setEntries] = useState<AdminEntry[]>([]);
  const [loadError, setLoadError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");

  const loadEntries = async () => {
    setLoadError("");
    try {
      const res = await fetch("/api/admin/entries", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) setEntries(data.entries as AdminEntry[]);
      else setLoadError(data.error || "Could not load entries.");
    } catch {
      setLoadError("Network error.");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = await res.json();
        if (data.authed) {
          setView("dashboard");
          loadEntries();
        } else {
          setView("login");
        }
      } catch {
        setView("login");
      }
    })();
  }, []);

  const login = async () => {
    setBusy(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setView("dashboard");
        setPassword("");
        loadEntries();
      } else {
        setLoginError(data.error || "Login failed.");
      }
    } catch {
      setLoginError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setView("login");
    setConfirming(false);
    setMessage("");
    setEntries([]);
  };

  const clearData = async () => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/clear", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMessage(`✓ Cleared ${data.deleted} entr${data.deleted === 1 ? "y" : "ies"}.`);
        setEntries([]);
      } else {
        setMessage(data.error || "Could not clear data.");
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  // ---- login view ----
  if (view !== "dashboard") {
    return (
      <main style={loginShell}>
        <div className="card" style={{ padding: "1.75rem", width: "100%", maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Image src="/litmus-bird.png" alt="" width={36} height={36} />
            <div>
              <h1 style={{ fontSize: "1.25rem", lineHeight: 1 }}>Admin</h1>
              <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Chaos Bird control panel</span>
            </div>
          </div>

          {view === "loading" && <p style={{ color: "var(--text-dim)" }}>Loading…</p>}

          {view === "login" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                autoCapitalize="none"
                autoCorrect="off"
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
              {loginError && <p style={errorText}>{loginError}</p>}
              <button className="btn btn-primary" onClick={login} disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <Link href="/" style={backLink}>
                ← Back to game
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ---- dashboard view ----
  return (
    <main style={dashShell}>
      <div className="card" style={{ padding: "1.5rem", width: "100%", maxWidth: 880 }}>
        <header style={dashHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/litmus-bird.png" alt="" width={34} height={34} />
            <div>
              <h1 style={{ fontSize: "1.2rem", lineHeight: 1 }}>Entries</h1>
              <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>
                {entries.length} player{entries.length === 1 ? "" : "s"} on the leaderboard
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-ghost"
              style={iconBtn}
              title="Refresh"
              onClick={loadEntries}
              disabled={busy}
            >
              ↻
            </button>
            <button
              className="btn"
              style={clearIconBtn}
              title="Clear all data"
              onClick={() => {
                setConfirming(true);
                setMessage("");
              }}
              disabled={busy || entries.length === 0}
            >
              🗑
            </button>
            <button className="btn btn-ghost" style={{ padding: "0.5rem 0.9rem", fontSize: "0.85rem" }} onClick={logout}>
              Sign out
            </button>
          </div>
        </header>

        {message && (
          <p style={{ margin: "0 0 0.9rem", fontSize: "0.88rem", color: message.startsWith("✓") ? "var(--good)" : "var(--bad)" }}>
            {message}
          </p>
        )}
        {loadError && <p style={{ ...errorText, marginBottom: "0.9rem" }}>{loadError}</p>}

        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={{ ...th, width: 56 }}>Rank</th>
                <th style={th}>Name</th>
                <th style={th}>Company</th>
                <th style={th}>LinkedIn</th>
                <th style={{ ...th, textAlign: "right", width: 80 }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...td, textAlign: "center", color: "var(--text-dim)", padding: "2rem" }}>
                    No entries yet.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.linkedin}>
                    <td style={{ ...td, fontWeight: 800 }}>
                      {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : e.rank}
                    </td>
                    <td style={{ ...td, fontWeight: 600 }}>{e.name}</td>
                    <td style={{ ...td, color: "var(--text-dim)" }}>{e.company || "—"}</td>
                    <td style={td}>
                      <a
                        href={e.linkedin.startsWith("http") ? e.linkedin : `https://${e.linkedin}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--litmus-purple-light)", textDecoration: "underline" }}
                      >
                        {e.linkedin}
                      </a>
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>{e.score}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <Link href="/leaderboard" style={backLink}>
            View public leaderboard →
          </Link>
        </div>
      </div>

      {confirming && (
        <div style={overlay} onClick={() => !busy && setConfirming(false)}>
          <div className="card" style={confirmCard} onClick={(ev) => ev.stopPropagation()}>
            <strong style={{ color: "var(--bad)", fontSize: "1.05rem" }}>Clear all data?</strong>
            <p style={{ color: "var(--text-dim)", fontSize: "0.88rem", margin: "0.5rem 0 1.1rem" }}>
              This permanently deletes all {entries.length} entr{entries.length === 1 ? "y" : "ies"} from the
              leaderboard. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button className="btn" style={{ ...clearIconBtn, flex: 1, fontSize: "0.95rem" }} onClick={clearData} disabled={busy}>
                {busy ? "Clearing…" : "Yes, delete all"}
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const loginShell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
};

const dashShell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "1.5rem",
};

const dashHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: "1.1rem",
};

const iconBtn: React.CSSProperties = {
  padding: "0.5rem 0.7rem",
  fontSize: "1rem",
  lineHeight: 1,
};

const clearIconBtn: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  fontSize: "1rem",
  lineHeight: 1,
  background: "linear-gradient(135deg, #ff7b7b, #e23b3b)",
  color: "#fff",
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.92rem",
  minWidth: 560,
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.6rem 0.75rem",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-dim)",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
};

const td: React.CSSProperties = {
  padding: "0.65rem 0.75rem",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  verticalAlign: "middle",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(5,3,15,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  zIndex: 50,
};

const confirmCard: React.CSSProperties = {
  padding: "1.5rem",
  width: "100%",
  maxWidth: 380,
  border: "1px solid rgba(255,107,107,0.4)",
};

const errorText: React.CSSProperties = {
  color: "var(--bad)",
  fontSize: "0.85rem",
  margin: 0,
};

const backLink: React.CSSProperties = {
  color: "var(--text-dim)",
  fontSize: "0.85rem",
};
