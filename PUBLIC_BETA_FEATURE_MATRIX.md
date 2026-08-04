# Public Beta Feature Matrix

Date: 2026-08-04
Release decision dependency: `PUBLIC_BETA_RELEASE_REPORT.md`

| Area | Feature | Current status | Beta release posture | Evidence / limitation |
| --- | --- | --- | --- | --- |
| Public site | Home, login, register, status, legal pages | Locally buildable | Ready with limitations | Smoke passed public route checks; production domain smoke not run. |
| SEO | Sitemap, robots, RSS, OG image, canonical/noindex | Locally verified | Ready with limitations | Local smoke passed; Search Console env missing locally. |
| Auth | Login/register/reset/update password | Implemented | Blocked for release | No authenticated E2E or staging account test evidence. |
| Onboarding | Profile/progress/demo data | Implemented | Ready with limitations | API routes build; no authenticated workflow test. |
| Dashboard | User dashboard | Implemented | Ready with limitations | Build passes and mobile source gate passes; authenticated mobile browser QA still required. |
| Lead management | Leads, notes, detail, filters | Implemented | Ready with limitations | Cross-origin smoke guards pass; no authenticated CRUD E2E. |
| Task/follow-up | Tasks, reminders, complete/snooze/cancel | Implemented | Ready with limitations | Cross-origin smoke guards pass; no authenticated workflow E2E. |
| Pipeline | Pipeline/status update | Implemented | Ready with limitations | Cross-origin smoke guard pass; no authenticated pipeline E2E. |
| Cadences | Templates, apply/bulk apply, lead cadence state | Implemented | Ready with limitations | Build passes; no authenticated E2E. |
| Import | Upload, mapping, validate, execute, error CSV | Implemented | Ready with limitations | Cross-origin smoke guards pass; no large-file/load QA evidence. |
| Export | Lead export/templates | Implemented | Ready with limitations | Cross-origin smoke guard pass; public template category read is intentionally public and should be reviewed. |
| Map discovery | Area/near-me/route/place details/save place | Implemented | Ready with limitations | Cross-origin smoke guards pass; real provider quota/domain test not run. |
| Analytics | Sales summaries, funnels, trends, goals | Implemented | Ready with limitations | Build passes; no authenticated data/state E2E or load test. |
| AI assistant | Generate/save/save to note | Implemented | Controlled/optional | Disable unless provider, cost cap, monitoring, and content safety owner approval are verified. |
| Billing | Plans/current/create/cancel/manual transfer | Implemented | Disabled until payment gate passes | Billing enable env missing locally; production payment not verified. |
| payOS | Create link, return/cancel, webhook, status | Implemented | Disabled | Requires webhook signature/live sandbox test and reconciliation evidence. |
| VietQR/manual | Bank transfer/VietQR manual | Implemented | Disabled or manual-only | Local VietQR/billing env incomplete; reconciliation and admin approval evidence missing. |
| Add-ons/orders | Catalog, orders, entitlements | Implemented | Limited | Server-owned pricing exists; automatic add-on payment bridge remains a known limitation. |
| Support tickets | User/admin ticket workflows | Implemented | Ready with limitations | Cross-origin smoke guards pass; latest RLS must be applied and role-tested. |
| Admin operations | Dashboard/users/payments/subscriptions/quotas/security | Implemented | Ready with limitations | Static/security/regression gates pass; authenticated role QA not run. |
| CMS | Posts/pages/categories/tags/redirects/blog/RSS | Implemented | Ready with limitations | Local smoke covers blog/RSS/cron secret; media upload is metadata/public URL only. |
| PWA/offline | Manifest, SW, offline page | Implemented | Ready with limitations | Local smoke passes; SW excludes `/api`, `/admin`, auth and billing from cache. |
| Settings/notifications | Settings, notification preferences, notification center | Implemented | Ready with limitations | Source gate exists in `UI_PHASE_2E1_SETTINGS_NOTIFICATIONS_REPORT.md`; delivery/provider QA still required. |

## Beta Disabled List

- Public self-serve registration unless invite-only approval is complete.
- Production billing, payOS, and VietQR until payment checklist passes.
- AI assistant unless cost and monitoring controls are approved.
- CMS media upload/storage beyond trusted public image URL metadata.
- Automatic add-on payment provisioning until order-payment bridge is complete.
