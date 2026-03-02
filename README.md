# Potty Pay Calculator

An interactive, multi-page static website for estimating how much people earn while taking bathroom breaks at work.

## Live site

- https://hubie-dubois.github.io/potty-pay-calculator/

## What's included

- Main calculator page (`index.html`)
  - Hourly + salary modes
  - Supports variable schedules (20-hour, 40-hour, 60-hour+)
  - Yearly/weekly/monthly/day/visit payout estimates
  - Poop-vs-pee percentage breakdown
  - Preset profiles
- Session timer page (`timer.html`)
  - Dedicated live throne timer page
  - Standalone pay profile (hourly/salary)
  - Local browser lifetime earnings tracker
- Comparison page (`lab.html`)
  - Scenario A vs Scenario B showdown
  - Annual earnings delta and winner indicator
- Facts page (`facts.html`)
  - 50+ poop/pee/toilet facts in a funnier style
  - Shuffle + random featured fact with category filters
  - Share/copy for featured facts
  - Daily potty fortune generator
- Leaderboard page (`leaderboard.html`)
  - Dedicated global leaderboard page (rankings shown at top)
  - Standalone submission profile (hourly/salary + schedule inputs)
  - All-time and monthly ranking tabs
  - Category rankings:
    - Yearly earnings
    - Weekly earnings
    - Toilet time per year
    - Total visits per day
    - Poop breaks per day
- Theme system
  - Automatically follows visitor/browser `prefers-color-scheme` (light/dark)

## Local development

This is a no-build static site. Open `index.html` in any modern browser.

## Automated checks

Run calculator engine tests:

```bash
npm test
```

## Free global leaderboard setup (Supabase)

1. Create a free Supabase project.
2. Open SQL editor and run: `leaderboard-schema.sql`
3. Open `supabase-config.js` and set:
   - `window.POTTY_PAY_SUPABASE_URL`
   - `window.POTTY_PAY_SUPABASE_ANON_KEY`
4. Commit/push. GitHub Pages will pick it up.

Notes:
- Leaderboard scores are calculated in the database using generated columns (`score_weekly`, `score_yearly`) so client submissions cannot directly set final score fields.
- Current anti-spam protection includes strict database input checks plus a frontend 15-second submit cooldown.
- The current #1 person is whichever row has the highest value for the currently selected ranking metric.

### Existing project migration

If your Supabase table already exists from earlier versions, run:

`leaderboard-migration-v2.sql`

## Fortune system

- The facts page includes a large fortune array in `script.js`.
- On load and on button click, the app picks a random fortune.
- It uses a non-repeating random picker so the next fortune is not the same as the previous one.

## Deployment

Hosted with GitHub Pages from branch `main` and root (`/`).
