"use client";

import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LeaderboardEntry } from "@/lib/types";

const SETTINGS_KEY = "chaosbird.leaderboard.settings";
const TOP_N = 10;

interface Settings {
  autoRefresh: boolean;
  intervalSec: number;
  qrUrl: string;
}

function defaultSettings(): Settings {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return { autoRefresh: false, intervalSec: 15, qrUrl: `${origin}/play` };
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted settings + honour ?refresh=N URL param.
  useEffect(() => {
    const base = defaultSettings();
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) Object.assign(base, JSON.parse(raw) as Partial<Settings>);
    } catch {
      /* ignore corrupt settings */
    }
    const param = new URLSearchParams(window.location.search).get("refresh");
    if (param !== null) {
      const n = Number.parseInt(param, 10);
      if (Number.isFinite(n) && n > 0) {
        base.autoRefresh = true;
        base.intervalSec = n;
      } else if (n === 0) {
        base.autoRefresh = false;
      }
    }
    setSettings(base);
    setHydrated(true);
  }, []);

  const persist = (next: Settings) => {
    setSettings(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/leaderboard?limit=${TOP_N}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEntries(data.entries as LeaderboardEntry[]);
        setUpdatedAt(new Date());
      } else {
        setError(data.error || "Could not load leaderboard.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hydrated) load();
  }, [hydrated, load]);

  // Auto-refresh timer.
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (settings.autoRefresh && settings.intervalSec > 0) {
      timerRef.current = window.setInterval(load, settings.intervalSec * 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [settings.autoRefresh, settings.intervalSec, load]);

  // Hidden toggle: press "S" to open settings.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "s" || e.key === "S") && !e.metaKey && !e.ctrlKey) {
        setShowSettings((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main style={shell}>
      <header style={topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/litmus-bird.png" alt="LitmusChaos" width={48} height={48} />
          <div>
            <h1 style={{ fontSize: "1.5rem", lineHeight: 1 }}>Chaos Bird Leaderboard</h1>
            <span style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
              LitmusChaos · KubeCon India
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>
            {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : "—"}
            {settings.autoRefresh ? ` · auto ${settings.intervalSec}s` : ""}
          </span>
          <button className="btn btn-secondary" onClick={load} disabled={loading} style={{ padding: "0.6rem 1rem" }}>
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setShowSettings((v) => !v)}
            title="Settings (press S)"
            style={{ padding: "0.6rem 0.8rem" }}
          >
            ⚙
          </button>
        </div>
      </header>

      <div className="lb-grid">
        <section className="card" style={{ padding: "1rem 1.25rem", overflow: "hidden" }}>
          {error && <p style={{ color: "var(--bad)", padding: "0.5rem 0" }}>{error}</p>}
          {entries.length === 0 && !loading && !error ? (
            <div style={emptyState}>
              <Image src="/litmus-bird.png" alt="" width={80} height={80} style={{ opacity: 0.5 }} />
              <p style={{ color: "var(--text-dim)", marginTop: 12 }}>
                No scores yet — scan the QR and be the first to fly!
              </p>
            </div>
          ) : (
            <ol style={{ listStyle: "none" }}>
              {entries.map((e) => (
                <li key={e.rank} style={rowStyle(e.rank)}>
                  <span style={medalStyle(e.rank)}>{medal(e.rank)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontWeight: e.rank <= 3 ? 800 : 600,
                        fontSize: e.rank <= 3 ? "1.25rem" : "1.05rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.name}
                    </span>
                    {e.company && (
                      <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-dim)" }}>
                        {e.company}
                      </span>
                    )}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: "1.3rem", color: e.rank === 1 ? "var(--gold)" : "var(--text)" }}>
                    {e.score}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="card" style={qrPanel}>
          <span className="pill">Scan to play</span>
          <div style={{ background: "#fff", padding: 16, borderRadius: 18, marginTop: 8 }}>
            {hydrated && settings.qrUrl ? (
              <QRCodeSVG value={settings.qrUrl} size={208} bgColor="#ffffff" fgColor="#3a2a82" level="M" />
            ) : (
              <div style={{ width: 208, height: 208 }} />
            )}
          </div>
          <p style={{ marginTop: 14, fontWeight: 700 }}>Top score wins swag!</p>
          <p style={{ color: "var(--text-dim)", fontSize: "0.82rem", marginTop: 4, textAlign: "center" }}>
            Flap the Chaos Bird through the cluster. One entry per email.
          </p>
        </aside>
      </div>

      {showSettings && (
        <div style={overlay} onClick={() => setShowSettings(false)}>
          <div className="card" style={settingsCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Display settings</h3>
            <label style={settingRow}>
              <span>Auto-refresh</span>
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => persist({ ...settings, autoRefresh: e.target.checked })}
              />
            </label>
            <label style={settingRow}>
              <span>Interval (seconds)</span>
              <input
                type="text"
                inputMode="numeric"
                value={String(settings.intervalSec)}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
                  persist({ ...settings, intervalSec: Number.isFinite(n) && n > 0 ? n : 1 });
                }}
                style={{ maxWidth: 110 }}
              />
            </label>
            <label style={{ ...settingRow, flexDirection: "column", alignItems: "stretch", gap: 6 }}>
              <span>QR target URL</span>
              <input
                type="text"
                value={settings.qrUrl}
                onChange={(e) => persist({ ...settings, qrUrl: e.target.value })}
              />
            </label>
            <p style={{ color: "var(--text-dim)", fontSize: "0.76rem", marginTop: 10 }}>
              Tip: you can also set auto-refresh via the URL, e.g. <code>/leaderboard?refresh=15</code>.
              Press <strong>S</strong> to toggle this panel. Settings are saved on this screen.
            </p>
            <Link href="/admin" className="btn btn-secondary" style={{ marginTop: 14, width: "100%" }}>
              🔒 Admin login
            </Link>
            <button className="btn btn-primary" style={{ marginTop: 10, width: "100%" }} onClick={() => setShowSettings(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  padding: "1.25rem 1.5rem 1.5rem",
};

const topBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: "1.25rem",
};

const qrPanel: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  textAlign: "center",
};

const emptyState: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "2rem",
};

function rowStyle(rank: number): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: rank <= 3 ? "0.85rem 0.9rem" : "0.6rem 0.9rem",
    borderRadius: 14,
    marginBottom: 6,
    background:
      rank === 1
        ? "linear-gradient(90deg, rgba(255,210,74,0.18), rgba(255,210,74,0.04))"
        : rank <= 3
          ? "rgba(255,255,255,0.06)"
          : "transparent",
    border: rank === 1 ? "1px solid rgba(255,210,74,0.4)" : "1px solid transparent",
  };
}

function medalStyle(rank: number): React.CSSProperties {
  return {
    width: 40,
    textAlign: "center",
    fontSize: rank <= 3 ? "1.5rem" : "1rem",
    fontWeight: 800,
    color: "var(--text-dim)",
  };
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(5,3,15,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  zIndex: 50,
};

const settingsCard: React.CSSProperties = {
  padding: "1.5rem",
  width: "100%",
  maxWidth: 380,
};

const settingRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "0.6rem 0",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
};
