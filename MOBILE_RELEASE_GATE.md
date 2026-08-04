# SaleMap Mobile Release Gate

Date: 2026-08-04
Scope: source/static mobile readiness, PWA-sensitive cache review, local automated mobile gate. No real device browser session and no authenticated mobile E2E were run.

## Decision

Mobile source gate: **PASS WITH CONTROLLED LIMITATIONS**

This closes the missing mobile artifact gap from the prior Public Beta report, but it does not convert the overall Public Beta release to pass. Real mobile browser QA is still required before production beta.

## Evidence

| Area | Status | Evidence |
| --- | --- | --- |
| Mobile app shell | Pass | `components/app/AppShell.tsx` has mobile header, bottom nav, safe-area top/bottom spacing, notification bell, language switcher, network banner, and feedback entry. |
| Mobile navigation | Pass | `lib/design-system/navigation.ts` keeps four primary mobile links plus a More sheet for secondary destinations. |
| Mobile dashboard ordering | Pass | Dashboard surfaces `TodayTasks` before mobile KPI grid and keeps quick discovery/checklist widgets. |
| Mobile lead detail action | Pass | Lead detail includes `data-testid="lead-mobile-action-bar"`. |
| Mobile filters | Pass | Lead/task/pipeline filters expose mobile drawer state. |
| Map discovery mobile mode | Pass | Discovery tabs expose `mobileView` list/map switching. |
| PWA sensitive cache exclusions | Pass | Service worker skips `/api`, `/admin`, `/app/billing`, auth, login, register, onboarding/password routes. |
| Automated gate | Added | `npm run test:mobile` runs `scripts/mobile-release-gate.mjs`. |

## Controlled Limitations

- No physical iOS/Android device QA was run.
- No Playwright/browser screenshot regression was run.
- No authenticated mobile session was available.
- No mobile performance/Lighthouse result was captured.

## Required Manual Mobile QA Before Beta

- 360x800 Android Chrome.
- 390x844 iPhone Safari.
- 768x1024 tablet.
- Authenticated dashboard, leads, tasks, discovery, settings, support tickets.
- Offline/online banner and logout cache clearing.
- Bottom nav and floating feedback button safe-area behavior.
