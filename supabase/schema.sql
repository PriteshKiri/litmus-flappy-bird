-- LitmusChaos Flappy Bird — Supabase schema
-- Run this in the Supabase SQL editor (Database -> SQL Editor -> New query).
--
-- IMPORTANT: If you already created an earlier version of the `scores` table
-- (the one keyed on email), the columns have changed. Drop it first so the
-- new table below is created. This wipes any existing rows:
--
--   drop table if exists public.scores;
--
-- Then run the rest of this file.

create extension if not exists "pgcrypto";

create table if not exists public.scores (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 80),
  -- Normalized LinkedIn profile (e.g. "linkedin.com/in/username").
  -- This is the uniqueness key: one entry per person.
  linkedin        text not null unique check (char_length(linkedin) between 5 and 200),
  -- Organization name for end users.
  company         text,
  -- Team using LitmusChaos, captured only for end users.
  litmus_usage_team text,
  -- Whether an end-user organization opted in to the public adopters list.
  wants_adopters_list boolean not null default false,
  -- Relationship to LitmusChaos: 'new_to_litmus' | 'end_user' | 'contributor'.
  litmus_relation text not null check (litmus_relation in ('new_to_litmus', 'end_user', 'contributor')),
  -- Whether they opted in to the LitmusChaos community calls.
  wants_community boolean not null default false,
  -- Email is captured ONLY when wants_community is true (used for the invite).
  email           text,
  score           int not null check (score >= 0),
  created_at      timestamptz not null default now()
);

-- Compatibility migration for tables created before the end-user fields.
alter table public.scores
  drop column if exists cncf_project,
  add column if not exists litmus_usage_team text,
  add column if not exists wants_adopters_list boolean not null default false;

-- Leaderboard is sorted by score desc, then earliest submission wins ties.
create index if not exists scores_score_idx
  on public.scores (score desc, created_at asc);

-- Row Level Security:
--   * Public (anon) may READ the leaderboard.
--   * Writes are blocked for anon; only the service-role key (used by the
--     Next.js API routes) can INSERT, which lets us enforce the score cap
--     and the one-entry-per-LinkedIn rule on the server.
alter table public.scores enable row level security;

drop policy if exists "Public can read leaderboard" on public.scores;
create policy "Public can read leaderboard"
  on public.scores
  for select
  to anon, authenticated
  using (true);

-- Handy view for exporting community-call sign-ups after the event:
--   select name, company, email, litmus_relation, litmus_usage_team, wants_adopters_list, created_at
--   from public.scores
--   where wants_community = true and email is not null;

-- Optional helper: wipe the leaderboard between event days.
--   truncate table public.scores;
