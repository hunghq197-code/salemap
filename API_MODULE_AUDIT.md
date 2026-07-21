# SaleMap API & Module Audit

Date: 2026-07-21, Asia/Saigon.

This file records the API/module audit so the home PC Codex session can continue without repeating the same checks.

## Audit Scope

- Scanned `app/api/**/route.ts`.
- Compared API references in app/components/lib/hooks/scripts with real API routes.
- Scanned Supabase table and RPC usage against SQL files in `supabase/`.
- Checked runtime env requirements from source.
- Ran local verification commands.

## Verification Results

Commands run:

```powershell
npm run smoke
npm run lint
npm run typecheck
npm run build
```

Results:

- Smoke passed 18/18 checks.
- Lint passed with 0 warnings and 0 errors.
- Typecheck passed.
- Production build passed.

## API Coverage

Static scan found:

- 70 API route files.
- 40 direct `/api/...` references in source.
- 0 missing API routes from those direct source references.
- 51 Supabase tables referenced by code.
- 0 Supabase RPC calls.
- All referenced Supabase tables have SQL definitions in `supabase/*.sql`.

Conclusion: no missing API endpoint was found by static route/reference comparison.

## Module Readiness

| Module | Source/API status | What is still needed |
| --- | --- | --- |
| Auth / register / login | Implemented | Supabase URL, anon or publishable key, service role key, Auth redirect URLs, optional invite codes. |
| Core CRM leads / notes / reminders | Implemented | Run base SQL schema and product schema; create real test user data. |
| Map discovery / route search | Implemented | `GOOGLE_MAPS_API_KEY`, Google Cloud billing, Geocoding API, Places API, Directions API, feature flags `map_discovery` and `route_search`. |
| Browser map rendering | Not required in current phase | `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` only matters if a real browser map UI is added later. |
| AI assistant | Implemented but disabled by default | Feature flag `ai_assistant`, `AI_PROVIDER`, `AI_API_KEY`, optional `AI_MODEL`, cost limit strategy. |
| Import CSV/XLSX | Implemented | `supabase/import-leads-schema.sql`, test CSV/XLSX files, authenticated test account. |
| Export CSV | Implemented | `supabase/export-template-schema.sql`, feature flag `export_csv`, enough lead data. |
| Pipeline / saved views | Implemented | `supabase/lead-pipeline-saved-views-schema.sql`, test leads with statuses. |
| Cleanup / duplicate merge / bulk actions | Implemented | `supabase/lead-cleanup-bulk-actions-schema.sql`, enough duplicate/bad-quality lead data. |
| Analytics / sales goals | Implemented | `supabase/personal-sales-analytics-goals-schema.sql`, activity data, optional cron `/api/cron/sales-analytics-snapshot`. |
| Billing manual payment | Implemented | Bank account env values, admin test account, subscription/payment SQL. |
| payOS payment gateway | Implemented but disabled by default | Feature flag `payment_gateway`, PayOS credentials, webhook URL, webhook verification, staging payment test. |
| Email notifications | Implemented but disabled by default | Feature flag `email_notifications`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, cron schedule. |
| Admin dashboard | Implemented | `supabase/admin-ops-schema.sql`; set `user_profiles.is_admin = true` for an admin test user. |
| Beta feedback / checklist / survey | Implemented | `supabase/beta-testing-schema.sql`, `supabase/public-beta-readiness-schema.sql`, `supabase/retention-beta-round-2-schema.sql`. |
| PWA / offline-lite | Implemented | HTTPS staging domain for service worker behavior; authenticated browser testing. |

## Configuration Findings

- The repo currently has `.env.example` only; no `.env.local` was present during this audit.
- Runtime feature flags are controlled by Supabase tables `feature_flags` and `user_feature_flags`, not by `NEXT_PUBLIC_ENABLE_*` env variables.
- `.env.example` was updated to remove stale `NEXT_PUBLIC_ENABLE_*` entries.
- `DEPLOYMENT.md` was updated so the SQL migration list matches `SUPABASE_SQL_SETUP.md`.

## Required Information From User

Before authenticated/live module testing, collect:

1. Supabase project URL.
2. Supabase anon or publishable key.
3. Supabase service role key.
4. Staging site URL or Vercel preview URL.
5. One normal test account email/password.
6. One admin test account email/password or user id to mark `is_admin = true`.
7. Confirmation that all SQL files in `SUPABASE_SQL_SETUP.md` were run in order.
8. Google Maps server API key and enabled APIs.
9. Whether AI should stay disabled or which provider/key/model to use.
10. Whether payment gateway should stay disabled or payOS credentials/webhook URL are ready.
11. Whether email notifications should stay disabled or Resend sender/key are ready.
12. Cron secret and hosting cron schedule, if cron modules should be tested.

## Recommended Next Phase

Next highest-value phase: authenticated staging smoke test.

That phase should:

- Start from a real `.env.local` or deployed staging URL.
- Login as a normal test user.
- Test create lead, note, reminder.
- Test map discovery with real Google key.
- Test import/export with small sample files.
- Test pipeline/saved views/cleanup.
- Login as admin and verify admin pages.
- Keep AI/payOS/email disabled unless keys are ready.
