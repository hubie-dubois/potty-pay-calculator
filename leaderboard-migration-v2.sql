-- Run this once on existing Supabase projects that already have leaderboard_entries.
-- Adds category metrics used by the upgraded leaderboard page.

alter table public.leaderboard_entries
  add column if not exists poop_visits_per_day numeric(5,2) not null default 0;

alter table public.leaderboard_entries
  drop constraint if exists leaderboard_entries_poop_visits_per_day_check;

alter table public.leaderboard_entries
  add constraint leaderboard_entries_poop_visits_per_day_check
  check (poop_visits_per_day >= 0 and poop_visits_per_day <= visits_per_day);

alter table public.leaderboard_entries
  add column if not exists bathroom_minutes_yearly numeric generated always as (
    minutes_per_visit * visits_per_day * workdays_per_week * weeks_per_year
  ) stored;

create index if not exists idx_leaderboard_entries_score_weekly_desc
  on public.leaderboard_entries (score_weekly desc);
create index if not exists idx_leaderboard_entries_bathroom_minutes_yearly_desc
  on public.leaderboard_entries (bathroom_minutes_yearly desc);
create index if not exists idx_leaderboard_entries_poop_visits_per_day_desc
  on public.leaderboard_entries (poop_visits_per_day desc);
