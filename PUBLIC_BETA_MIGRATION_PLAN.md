# Public Beta Migration Plan

Date: 2026-08-04
Status: **Not executed by this gate**

## Decision

Migration readiness: **FAIL until verified**

The repository contains a clear Supabase SQL setup order, but this gate did not run migrations against staging or production. There is no proof that all SQL files, RLS policies, seed data, indexes, and admin security updates are applied to the real database behind `salemap.io.vn`.

## Required SQL Order

Run on staging first, then production only after backup and rollback approval.

1. `supabase/schema.sql`
2. `supabase/product-schema.sql`
3. `supabase/map-discovery-schema.sql`
4. `supabase/route-search-schema.sql`
5. `supabase/beta-testing-schema.sql`
6. `supabase/export-template-schema.sql`
7. `supabase/seed-templates.sql`
8. `supabase/billing-upgrade-interest-schema.sql`
9. `supabase/admin-ops-schema.sql`
10. `supabase/notifications-schema.sql`
11. `supabase/retention-beta-round-2-schema.sql`
12. `supabase/public-beta-readiness-schema.sql`
13. `supabase/manual-payment-subscription-schema.sql`
14. `supabase/revenue-renewal-churn-schema.sql`
15. `supabase/payos-payment-gateway-schema.sql`
16. `supabase/ai-sales-assistant-schema.sql`
17. `supabase/import-leads-schema.sql`
18. `supabase/lead-cleanup-bulk-actions-schema.sql`
19. `supabase/lead-pipeline-saved-views-schema.sql`
20. `supabase/personal-sales-analytics-goals-schema.sql`
21. `supabase/follow-up-task-center-schema.sql`
22. `supabase/performance-indexes.sql`
23. `supabase/cadences.sql`
24. `supabase/seed-cadence-templates.sql`
25. `supabase/admin-security.sql`
26. `supabase/onboarding-activation.sql`
27. `supabase/billing-provider-architecture.sql`
28. `supabase/admin-customer-crm.sql`
29. `supabase/orders-product-catalog.sql`
30. `supabase/support-tickets.sql`
31. `supabase/seo-cms.sql`

## RLS Updates That Must Be Confirmed

The latest admin operations work tightened support/admin write access. Before beta, confirm these files are applied or rerun:

- `supabase/admin-security.sql`
- `supabase/admin-customer-crm.sql`
- `supabase/support-tickets.sql`

## Pre-Migration Checklist

- [ ] Confirm target Supabase project and environment.
- [ ] Take backup and record backup timestamp/id.
- [ ] Confirm restore path and owner.
- [ ] Run SQL on staging.
- [ ] Verify no unexpected destructive statements against production data.
- [ ] Validate RLS with normal user, support, admin, and super admin accounts.
- [ ] Run local/static gates and staging smoke after migration.
- [ ] Approve production migration window.

## Post-Migration Verification

- [ ] Auth login/register/reset work on target domain.
- [ ] Normal user can only read/write own data.
- [ ] Support can view allowed support/admin surfaces only and cannot mutate protected admin resources directly.
- [ ] Admin/super admin permissions match role matrix.
- [ ] Payment records cannot be manually self-activated by users.
- [ ] Cron endpoints require `Authorization: Bearer <CRON_SECRET>`.
- [ ] payOS webhook requires valid signature if enabled.
- [ ] Feature flags and beta invite controls work.

## Rollback Position

Supabase SQL changes should be treated as fix-forward by default. Rollback requires a database backup/restore decision from the data owner. No production rollback should be attempted without owner approval.
