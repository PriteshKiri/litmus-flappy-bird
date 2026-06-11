import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.25rem",
        textAlign: "center",
        gap: "1.5rem",
      }}
    >
      <span className="pill">LitmusChaos · KubeCon India</span>

      <Image
        src="/litmus-bird.png"
        alt="LitmusChaos Chaos Bird"
        width={180}
        height={180}
        priority
        style={{ filter: "drop-shadow(0 18px 30px rgba(91,66,188,0.5))" }}
      />

      <div>
        <h1 style={{ fontSize: "2.4rem", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          Chaos Bird
        </h1>
        <p style={{ color: "var(--text-dim)", marginTop: "0.5rem", maxWidth: 340 }}>
          Flap through the cluster, dodge the chaos, and climb the leaderboard.
          Top score wins LitmusChaos swag!
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: 320 }}>
        <Link href="/play" className="btn btn-primary" style={{ width: "100%" }}>
          ▶ Play now
        </Link>
        <Link href="/leaderboard" className="btn btn-ghost" style={{ width: "100%" }}>
          View leaderboard
        </Link>
      </div>

      <p style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginTop: "0.5rem" }}>
        One entry per email · Powered by Chaos Engineering
      </p>
    </main>
  );
}
