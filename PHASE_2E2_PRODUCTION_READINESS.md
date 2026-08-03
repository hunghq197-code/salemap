# Phase 2E2 Subphase F - Security, Regression, Production Readiness

Date: 2026-08-03, Asia/Saigon.

## Scope Delivered

- Added a local Phase 2E2 regression script:
  - `npm run test:phase2e2`
  - source file: `scripts/phase-2e2-regression.mjs`
- Added static regression coverage for:
  - required Phase 2E2 migrations, routes, and reports
  - Supabase SQL setup order
  - broad RLS policy guardrails
  - Admin CRM lead privacy guardrails
  - order minimum amount and server-owned pricing/entitlement rules
  - ticket public/internal message boundaries
  - CMS sanitizer, public publish rules, noindex sitemap behavior, redirects, RSS, JSON-LD, and cron secret
  - support role permission boundaries
  - smoke coverage for customer/ticket/CMS public and mutation guard checks
- Replaced CMS blog `<img>` rendering with `next/image` using `unoptimized`, avoiding lint suppression while still allowing admin-managed remote image URLs.
- Updated `SECURITY_CHECKLIST.md` to include the new Phase 2E2 regression gate.

## Production Deployment Checklist

Run the Phase 2E2 SQL files in this order after the existing setup:

```text
supabase/admin-customer-crm.sql
supabase/orders-product-catalog.sql
supabase/support-tickets.sql
supabase/seo-cms.sql
```

Required runtime configuration:

- `CRON_SECRET` must be set in production.
- Configure a scheduler to call:

```text
POST https://salemap.io.vn/api/cron/cms-publish
Authorization: Bearer <CRON_SECRET>
```

- Existing billing/payOS/manual bank/VietQR env vars must remain configured as documented in `.env.example`.
- No secret values should be committed to Git.

## Automated Gates

```powershell
npm run typecheck
npm run lint
npm run security:scan
npm run test:phase2e2
npm run build
npm run smoke
```

Results:

- Typecheck passed.
- Lint passed with 0 warnings and 0 errors.
- Security scan passed.
- Phase 2E2 regression passed.
- Production build passed.
- Smoke test passed 47/47 checks.

## Manual Staging Tests Still Required

- Login as `super_admin`, `admin`, and `support`.
- Verify `/admin/customers` and `/admin/customers/[userId]` show CRM/account/payment/order/ticket aggregates, not private lead PII.
- Verify support can manage tickets but cannot manage CMS, catalog, orders, payments, or subscriptions.
- Create an add-on order from `/app/billing/add-ons`, then mark paid/provision from admin and confirm entitlement grants are idempotent.
- Create user and admin ticket replies and confirm users cannot see internal notes.
- Create CMS draft/review/scheduled/published posts and pages.
- Confirm draft and future scheduled content is not public.
- Run CMS cron after a scheduled time and confirm published content appears in `/blog`, `/rss.xml`, and `/sitemap.xml`.
- Validate 301/302 CMS redirects with internal paths only.
- Check responsive layouts at 360x800, 390x844, 430x932, 768x1024, 1366x768, 1440x900, and 1920x1080.

## Production Risks Remaining

- Self-serve add-on order checkout is not yet connected directly to payOS/VietQR payment creation. Current flow supports server-owned add-on orders and admin mark-paid/provisioning. Treat automatic add-on sales as blocked until the order-payment checkout bridge is implemented and tested.
- CMS media upload/storage is metadata-only in this phase. Use trusted public image URLs until Supabase Storage upload validation is added.
- Authenticated browser E2E tests require seeded staging accounts and were not added in this subphase.
- CMS preview tokens, revision restore, rich block editing, and category/tag/media mutation forms remain deferred.

## Go/No-Go

Phase 2E2 is ready for staging after SQL and env setup. It should not be treated as fully production-ready for automated add-on commerce until the order-payment bridge is closed.
