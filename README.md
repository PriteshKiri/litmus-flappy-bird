# Chaos Bird — LitmusChaos Flappy Bird for KubeCon

A mobile-first Flappy Bird game starring the **LitmusChaos Chaos Bird**, themed
around Kubernetes / CNCF, built for a booth at KubeCon India. Players scan a QR
code, register, and fly the bird through Kubernetes pillars. The highest
submitted score tops the leaderboard and wins LitmusChaos swag.

### Registration fields

- **Name** (required)
- **LinkedIn profile** (required) — the uniqueness key: one entry per person
- **Company / organization** (optional)
- **CNCF contribution** — optional "I've contributed to a CNCF project" + which one
- **Relationship to LitmusChaos** (required): New to Litmus / End user / Contributor
- **Join community calls?** — optional; only then is an **email** collected, for
  the monthly community & contributor meeting invite

Built with **Next.js (App Router) + Supabase**.

## Features

- 📱 Mobile-first PWA-style game — tap to flap, one-finger control.
- 🐦 Uses the LitmusChaos Chaos Bird mascot and brand purple (`#5b42bc`).
- ☸️ Kubernetes-themed obstacles (helm-wheel pillars) and "cluster" backdrop.
- 🏆 Booth leaderboard screen with a QR code to play.
- 🔁 Manual **Refresh** button (always visible) **plus** a configurable
  auto-refresh interval (hidden behind a settings panel — press **S**).
- 🔒 One score submission per LinkedIn profile, enforced server-side, with an
  anti-cheat score cap.
- ↻ Players can retry as many times as they like, then choose to **Submit** or
  **Play again**. Only submitted scores appear on the leaderboard.

## Routes

| Route          | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `/`            | Landing / start screen                                         |
| `/play`        | Register → play → submit or play again (open this from the QR) |
| `/leaderboard` | Booth display: top 10, QR code, refresh + settings             |
| `/admin`       | Local-login panel to clear all leaderboard data between trials  |
| `/api/submit`  | `POST` a score (one per LinkedIn, score-capped)                |
| `/api/leaderboard` | `GET` the top N scores                                     |

## Admin panel (`/admin`)

A simple local login (no Supabase auth) for wiping the leaderboard between
trial runs without opening Supabase.

- **Default login**: `admin@litmuschaos.io` / `litmus@123Chaos`
  (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local`).
- After signing in, use **Clear all data** (with confirm) to delete every entry.
- Credentials are verified server-side; the action is gated behind an httpOnly
  session cookie, so the password never ships to the browser. Set
  `ADMIN_SESSION_SECRET` to a random string in production.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the Supabase project + schema

1. Create a project at [supabase.com](https://supabase.com).
2. Open **Database → SQL Editor** and run the contents of
   [`supabase/schema.sql`](./supabase/schema.sql).

### 3. Configure environment variables

Copy the example file and fill in your Supabase values:

```bash
cp .env.local.example .env.local
```

| Variable                        | Where to find it                          |
| ------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API → URL   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API → service_role (**server only**) |
| `SCORE_MAX`                     | Max plausible score accepted (anti-cheat) |

### 4. Run it

```bash
npm run dev
```

- Game: <http://localhost:3000/play>
- Booth screen: <http://localhost:3000/leaderboard>

## Booth-day tips

- **The QR code** on `/leaderboard` points to `/play` by default. Once deployed,
  open the settings panel (press **S** or click ⚙) and set the **QR target URL**
  to your public URL (e.g. `https://your-app.vercel.app/play`).
- **Auto-refresh**: either toggle it in the settings panel, or load the screen as
  `/leaderboard?refresh=15` to auto-refresh every 15 seconds. The setting is saved
  in the browser, so the booth screen remembers it.
- **Reset between days**: run `truncate table public.scores;` in the Supabase SQL
  editor to clear the leaderboard.
- Run the `/leaderboard` page fullscreen (F11) on the booth monitor.

## Deploying

Deploy to Vercel (or any Next.js host) and add the same environment variables in
the host's project settings. Point the QR target URL at the deployed `/play`.

## Adjusting difficulty

Gameplay constants live at the top of
[`components/FlappyGame.tsx`](./components/FlappyGame.tsx) — gravity, flap
strength, pipe speed/ramp, and gap sizes are all easy to tune.
