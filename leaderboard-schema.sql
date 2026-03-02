-- Run this in Supabase SQL editor.
-- This schema keeps inserts cheap/free and prevents client-side score spoofing
-- by calculating score_yearly and score_weekly as generated columns.

create extension if not exists pgcrypto;

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 24),
  region text not null default '' check (char_length(region) <= 24),
  pay_type text not null check (pay_type in ('hourly', 'salary')),
  hourly_rate numeric(10,2) not null default 0 check (hourly_rate >= 0 and hourly_rate <= 1000),
  annual_salary numeric(12,2) not null default 0 check (annual_salary >= 0 and annual_salary <= 10000000),
  hours_per_week numeric(5,2) not null check (hours_per_week > 0 and hours_per_week <= 120),
  workdays_per_week numeric(4,2) not null check (workdays_per_week > 0 and workdays_per_week <= 7),
  minutes_per_visit numeric(5,2) not null check (minutes_per_visit > 0 and minutes_per_visit <= 180),
  visits_per_day numeric(5,2) not null check (visits_per_day > 0 and visits_per_day <= 20),
  poop_visits_per_day numeric(5,2) not null default 0 check (poop_visits_per_day >= 0 and poop_visits_per_day <= visits_per_day),
  weeks_per_year numeric(5,2) not null check (weeks_per_year > 0 and weeks_per_year <= 52),
  -- server-side computed values
  score_weekly numeric generated always as (
    (
      (
        case
          when pay_type = 'salary' then annual_salary / (hours_per_week * weeks_per_year)
          else hourly_rate
        end
      ) / 60.0
    ) * minutes_per_visit * visits_per_day * workdays_per_week
  ) stored,
  score_yearly numeric generated always as (
    (
      (
        case
          when pay_type = 'salary' then annual_salary / (hours_per_week * weeks_per_year)
          else hourly_rate
        end
      ) / 60.0
    ) * minutes_per_visit * visits_per_day * workdays_per_week * weeks_per_year
  ) stored,
  score_daily numeric generated always as (
    (
      (
        case
          when pay_type = 'salary' then annual_salary / (hours_per_week * weeks_per_year)
          else hourly_rate
        end
      ) / 60.0
    ) * minutes_per_visit * visits_per_day
  ) stored,
  bathroom_minutes_yearly numeric generated always as (
    minutes_per_visit * visits_per_day * workdays_per_week * weeks_per_year
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_leaderboard_entries on public.leaderboard_entries;
create trigger trg_touch_leaderboard_entries
before update on public.leaderboard_entries
for each row
execute function public.touch_updated_at();

alter table public.leaderboard_entries enable row level security;

-- Anyone can read leaderboard rows.
drop policy if exists "public read leaderboard" on public.leaderboard_entries;
create policy "public read leaderboard"
on public.leaderboard_entries
for select
using (true);

-- Anyone with anon key can insert rows. Database checks guard values.
drop policy if exists "public insert leaderboard" on public.leaderboard_entries;
create policy "public insert leaderboard"
on public.leaderboard_entries
for insert
with check (true);

create index if not exists idx_leaderboard_entries_score_yearly_desc
  on public.leaderboard_entries (score_yearly desc);
create index if not exists idx_leaderboard_entries_score_weekly_desc
  on public.leaderboard_entries (score_weekly desc);
create index if not exists idx_leaderboard_entries_score_daily_desc
  on public.leaderboard_entries (score_daily desc);
create index if not exists idx_leaderboard_entries_bathroom_minutes_yearly_desc
  on public.leaderboard_entries (bathroom_minutes_yearly desc);
create index if not exists idx_leaderboard_entries_poop_visits_per_day_desc
  on public.leaderboard_entries (poop_visits_per_day desc);
create index if not exists idx_leaderboard_entries_updated_at_desc
  on public.leaderboard_entries (updated_at desc);
