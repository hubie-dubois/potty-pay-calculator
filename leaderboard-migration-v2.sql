-- Run this once on existing Supabase projects that already have leaderboard_entries.
-- Upgrades category metrics to use split poop/pee visit durations.

alter table public.leaderboard_entries
  add column if not exists poop_visits_per_day numeric(5,2) not null default 0;

alter table public.leaderboard_entries
  add column if not exists poop_minutes_per_visit numeric(5,2);

alter table public.leaderboard_entries
  add column if not exists pee_minutes_per_visit numeric(5,2);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leaderboard_entries'
      and column_name = 'minutes_per_visit'
  ) then
    update public.leaderboard_entries
    set
      poop_minutes_per_visit = coalesce(poop_minutes_per_visit, nullif(minutes_per_visit, 0), 12),
      pee_minutes_per_visit = coalesce(pee_minutes_per_visit, greatest(coalesce(minutes_per_visit, 5) * 0.5, 1), 5);
  else
    update public.leaderboard_entries
    set
      poop_minutes_per_visit = coalesce(poop_minutes_per_visit, 12),
      pee_minutes_per_visit = coalesce(pee_minutes_per_visit, 5);
  end if;
end $$;

alter table public.leaderboard_entries
  alter column poop_minutes_per_visit set not null,
  alter column pee_minutes_per_visit set not null;

alter table public.leaderboard_entries
  drop constraint if exists leaderboard_entries_poop_visits_per_day_check;

alter table public.leaderboard_entries
  add constraint leaderboard_entries_poop_visits_per_day_check
  check (poop_visits_per_day >= 0 and poop_visits_per_day <= visits_per_day);

alter table public.leaderboard_entries
  drop constraint if exists leaderboard_entries_poop_minutes_per_visit_check;

alter table public.leaderboard_entries
  add constraint leaderboard_entries_poop_minutes_per_visit_check
  check (poop_minutes_per_visit > 0 and poop_minutes_per_visit <= 180);

alter table public.leaderboard_entries
  drop constraint if exists leaderboard_entries_pee_minutes_per_visit_check;

alter table public.leaderboard_entries
  add constraint leaderboard_entries_pee_minutes_per_visit_check
  check (pee_minutes_per_visit > 0 and pee_minutes_per_visit <= 180);

drop index if exists idx_leaderboard_entries_score_weekly_desc;
drop index if exists idx_leaderboard_entries_score_yearly_desc;
drop index if exists idx_leaderboard_entries_score_daily_desc;
drop index if exists idx_leaderboard_entries_bathroom_minutes_yearly_desc;

alter table public.leaderboard_entries
  drop column if exists score_weekly,
  drop column if exists score_yearly,
  drop column if exists score_daily,
  drop column if exists bathroom_minutes_yearly;

alter table public.leaderboard_entries
  add column score_weekly numeric generated always as (
    (
      (
        case
          when pay_type = 'salary' then annual_salary / (hours_per_week * weeks_per_year)
          else hourly_rate
        end
      ) / 60.0
    ) * (
      (poop_minutes_per_visit * poop_visits_per_day) +
      (pee_minutes_per_visit * (visits_per_day - poop_visits_per_day))
    ) * workdays_per_week
  ) stored;

alter table public.leaderboard_entries
  add column score_yearly numeric generated always as (
    (
      (
        case
          when pay_type = 'salary' then annual_salary / (hours_per_week * weeks_per_year)
          else hourly_rate
        end
      ) / 60.0
    ) * (
      (poop_minutes_per_visit * poop_visits_per_day) +
      (pee_minutes_per_visit * (visits_per_day - poop_visits_per_day))
    ) * workdays_per_week * weeks_per_year
  ) stored;

alter table public.leaderboard_entries
  add column score_daily numeric generated always as (
    (
      (
        case
          when pay_type = 'salary' then annual_salary / (hours_per_week * weeks_per_year)
          else hourly_rate
        end
      ) / 60.0
    ) * (
      (poop_minutes_per_visit * poop_visits_per_day) +
      (pee_minutes_per_visit * (visits_per_day - poop_visits_per_day))
    )
  ) stored;

alter table public.leaderboard_entries
  add column bathroom_minutes_yearly numeric generated always as (
    (
      (poop_minutes_per_visit * poop_visits_per_day) +
      (pee_minutes_per_visit * (visits_per_day - poop_visits_per_day))
    ) * workdays_per_week * weeks_per_year
  ) stored;

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
