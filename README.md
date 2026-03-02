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
  - Real-time throne session timer
  - Local browser lifetime earnings tracker
  - Random "potty fortune" generator
- Comparison page (`lab.html`)
  - Scenario A vs Scenario B showdown
  - Annual earnings delta and winner indicator

## Local development

This is a no-build static site. Open `index.html` in any modern browser.

## Automated checks

Run calculator engine tests:

```bash
npm test
```

## Deployment

Hosted with GitHub Pages from branch `main` and root (`/`).
