# Public Beta Security Review

Date: 2026-08-04
Scope: source scan, SQL policy spot checks, config review, smoke guard checks. No penetration test and no production data access.

## Decision

Security readiness: **FAIL for Public Beta**

Internal source security scan and npm audit pass, but the full security gate cannot pass because authenticated user isolation was not tested, production RLS application is unverified, monitoring evidence is missing, and backup/restore evidence is missing.

## Passing Evidence

- `npm run security:scan`: `SECURITY SCAN PASS`.
- `npm audit --cache .npm-cache --audit-level=moderate`: `found 0 vulnerabilities`.
- `npm run test:mobile`: `MOBILE RELEASE GATE PASS`.
- `npm run smoke`: 47/47 local checks passed, including cross-origin rejection for major mutating APIs.
- `next.config.mjs` includes CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer Policy, Permissions Policy, and production HSTS.
- Service worker skips sensitive routes: `/api`, `/admin`, `/app/billing`, `/auth`, `/login`, `/register`, `/onboarding`, password routes.
- payOS webhook route is covered by internal scan for signature verification and IP rate limiting.
- Cron routes are scanned for `CRON_SECRET` usage.
- `.env.local` is ignored by git.

## Failing Or Unverified Evidence

| Risk | Severity | Status |
| --- | --- | --- |
| Production/staging RLS policies applied | Critical | Unverified. |
| Normal user cannot read another user's data | Critical | Unverified by authenticated E2E. |
| Support role is read-only in real DB | Critical | Unverified by authenticated E2E and migration proof. |
| Admin/super admin boundaries | Critical | Unverified by authenticated E2E. |
| Backup/restore | Blocker | Unverified. |
| Monitoring/alerting | Critical | Unverified. |
| Raw production error behavior | Major | Not manually verified. |

## Static SQL Notes

- `supabase/export-template-schema.sql` allows public read on `template_categories` with `using (true)`. This appears intentional for public template categories, but production content should be reviewed before launch.
- New Phase 2E2 migrations are guarded by `npm run test:phase2e2` against broad `using (true)` and `with check (true)` patterns.

## Required Before Re-Gate

1. Apply and verify all required SQL migrations in staging.
2. Run authenticated E2E for normal user, support, admin, and super admin.
3. Verify RLS with cross-user negative tests.
4. Verify production monitoring captures server/client errors.
5. Verify no secret envs are exposed in client bundles.
6. Verify payment webhook and cron endpoints with invalid/valid auth paths.
