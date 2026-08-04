# Public Beta Browser Matrix

Date: 2026-08-04
Status: **Incomplete**

## Decision

Browser/mobile readiness: **FAIL for Public Beta**

No full browser/device matrix was executed during this gate. Local smoke uses Node fetch checks and the mobile release gate uses source checks; they do not prove responsive visual quality, tap ergonomics, or authenticated browser behavior on real devices.

## Current Evidence

| Evidence | Result |
| --- | --- |
| Local fetch smoke | Passed 47/47 checks. |
| Domain fetch smoke | `https://salemap.io.vn` passed public routes, protected/admin redirects, security headers, and manifest. |
| Production build | Passed. |
| Service worker sensitive route skip | Confirmed by source review. |
| Mobile dashboard release gate | Source gate passes via `npm run test:mobile`. |
| Authenticated browser E2E | Missing. |
| Staging URL browser QA | Missing. |

## Required Matrix

| Platform | Browser | Viewport/device | Required workflows |
| --- | --- | --- | --- |
| iOS | Safari | iPhone 13/14 size | Login, dashboard, leads, tasks, discovery, bottom nav. |
| Android | Chrome | 360x800 and 390x844 | Login, dashboard, leads, tasks, import, support. |
| Desktop | Chrome | 1366x768 and 1440x900 | Dashboard, admin, billing, CMS, maps. |
| Desktop | Edge | 1366x768 | Auth, dashboard, admin read/write guards. |
| Desktop | Firefox | 1366x768 | Core app and public pages. |
| Tablet | Safari/Chrome | 768x1024 | Dashboard, maps, lead detail, admin tables. |

## Required Pass Conditions

- No overlapping text or controls.
- Bottom/mobile nav does not cover primary actions.
- Forms are usable with mobile keyboard.
- Admin tables remain readable or intentionally scrollable.
- Map/search panes remain usable.
- PWA install/offline states do not cache sensitive content.
- Auth redirects work on real browser sessions.
