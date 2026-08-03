# SaleMap Phase 2E2 Subphase A Audit

Date: 2026-08-03, Asia/Saigon

Scope: Admin CRM, Customer 360, Orders, Product Catalog, Feature Add-ons, Entitlement Grants, Support Tickets, and SEO CMS.

This document is the required Subphase A audit before implementing Phase 2E2. No runtime schema, API, or UI behavior is changed by this document.

## Executive Decision

Phase 2E2 is too large to ship safely in one uncontrolled pass. The correct rollout is sequential:

1. Subphase A: audit and data architecture.
2. Subphase B: Admin CRM Dashboard, Customer List, Customer 360, lifecycle, tags, and internal notes.
3. Subphase C: Orders, Product Catalog, Feature Catalog, Add-ons, and Entitlement Grants.
4. Subphase D: Support Ticket System.
5. Subphase E: WordPress-like SEO CMS.
6. Subphase F: security, performance, automated tests, regression, production readiness.

The largest architectural risk is confusing two different customer concepts:

- SaleMap customer: the registered/paying account that admin CRM may manage.
- User lead: private sales lead data owned by each SaleMap user.

Phase 2E2 must not give admin/support default access to private lead fields such as lead phone, email, address detail, notes, task content, or cadence content. Customer 360 may show only aggregate usage/counts for lead-related modules unless a separate break-glass workflow is designed and approved.

## Current Stack

- Next.js 16.2.11 App Router.
- React 19.2.7.
- TypeScript 5.7.2.
- Tailwind CSS.
- Supabase Auth, PostgreSQL, RLS, and service-role server helpers.
- Google Maps / Places provider for discovery.
- Billing providers: `manual_bank_transfer`, `vietqr_manual`, `payos`.
- PWA/offline helpers.
- Admin role guard, admin audit logs, security events, rate-limit helpers.

Relevant scripts available in `package.json`:

- `npm run typecheck`
- `npm run lint`
- `npm run security:scan`
- `npm run build`
- `npm run smoke`

## Existing Admin Architecture

Server-side admin access is implemented with:

- `lib/admin/auth.ts`
- `lib/admin/admin-permissions.ts`
- `lib/admin/api-guard.ts`
- `lib/admin/audit-log.ts`
- `components/admin/AdminShell.tsx`

Current roles:

- `super_admin`
- `admin`
- `support`

Current permission model is role-to-permission mapping in code. It covers user detail, payments, subscriptions, usage, feedback, audit logs, system health, quota overrides, feature overrides, and selected billing mutations. It does not yet cover finance/content/catalog/ticket granular roles.

Current admin navigation is a flat compact list from `lib/design-system/navigation.ts`:

- `/admin`
- `/admin/users`
- `/admin/subscriptions`
- `/admin/payments`
- `/admin/usage`
- `/admin/feedback`
- `/admin/audit-logs`
- `/admin/system`
- `/admin/settings`
- secondary: `/admin/payment-requests`, `/admin/quotas`

Other existing admin routes discovered:

- `/admin/ai-usage`
- `/admin/beta-cohorts`
- `/admin/beta-signups`
- `/admin/data-quality`
- `/admin/feature-flags`
- `/admin/imports`
- `/admin/invite-codes`
- `/admin/lead-views`
- `/admin/payment-gateway`
- `/admin/qa`
- `/admin/retention`
- `/admin/revenue`
- `/admin/sales-analytics`
- `/admin/surveys`
- `/admin/upgrade-interests`

Missing Phase 2E2 admin routes:

- `/admin/customers`
- `/admin/customers/[userId]`
- `/admin/customer-segments`
- `/admin/customer-tags`
- `/admin/orders`
- `/admin/orders/[orderId]`
- `/admin/catalog`
- `/admin/catalog/products`
- `/admin/catalog/prices`
- `/admin/catalog/features`
- `/admin/catalog/entitlements`
- `/admin/tickets`
- `/admin/tickets/[ticketId]`
- `/admin/tickets/categories`
- `/admin/tickets/sla`
- `/admin/cms`
- `/admin/cms/posts`
- `/admin/cms/pages`
- `/admin/cms/categories`
- `/admin/cms/tags`
- `/admin/cms/media`
- `/admin/cms/redirects`
- `/admin/cms/seo`

Admin IA should be expanded only after routes and server permissions exist. Do not display non-existing routes, and do not rely on client-only role checks.

## Existing Admin Data Access

Important current data helpers:

- `lib/admin/data/common.ts`
- `lib/admin/data/overview.ts`
- `lib/admin/data/users.ts`
- `lib/admin/data/billing-payments.ts`
- `lib/admin/data/subscriptions.ts`
- `lib/admin/data/revenue.ts`
- `lib/admin/data/usage.ts`
- `lib/admin/data/security.ts`

Performance concern:

- `listAuthUsers()` fetches only the first Supabase Auth page, default `perPage=1000`.
- `listProfiles()` fetches all user profiles.
- `listUserIdRows()` reads up to 10,000 rows and counts in memory.
- `getAdminUsers()` and `getAdminOverviewData()` perform multiple in-memory joins and filters.

Subphase B must replace high-cardinality customer/admin dashboard reads with server-side aggregate queries, database views, or RPCs before adding Customer 360 scale.

## Existing Billing Architecture

Current source-of-truth files:

- `lib/billing/plans.ts`
- `lib/constants/subscription-plans.ts`
- `lib/billing/payments.ts`
- `lib/billing/subscriptions.ts`
- `lib/billing/entitlements.ts`
- `lib/billing/types.ts`
- `supabase/billing-provider-architecture.sql`

Current billing tables:

- `subscriptions`
- `payments`
- `payment_events`
- `subscription_events`
- legacy `payment_requests`
- legacy `payment_gateway_transactions`

Current payment protections:

- Client does not provide amount to `/api/billing/create-payment`.
- Payment amount is derived from server plan source.
- `isValidPaymentTransition()` validates payment state changes.
- `isPaymentAlreadyProcessed()` prevents duplicate paid processing.
- payOS webhook validates signature and applies IP rate limiting.
- Amount mismatch writes `payment_amount_mismatch` security events.
- Subscription activation is idempotent through paid subscription events per payment.

Billing gap for Phase 2E2:

- There is no separate order model.
- There is no order item snapshot.
- There is no product catalog table.
- There is no immutable/versioned price table.
- There is no feature catalog table.
- There is no add-on purchase flow.
- There is no entitlement grant ledger.
- Current entitlements are plan-based plus admin quota/feature overrides.

## Existing Entitlement Architecture

Current entitlement files:

- `lib/billing/entitlements.ts`
- `lib/billing/plans.ts`
- `lib/constants/subscription-plans.ts`
- `supabase/admin-security.sql` for `user_quota_overrides` and `user_feature_overrides`

Current entitlement source:

- active subscription plan
- hardcoded plan quotas/features
- user quota overrides
- user feature overrides

Missing:

- `entitlement_grants`
- grant source types: `subscription`, `addon_purchase`, `admin_override`, `promotion`
- grant types: `boolean_access`, `quota`, `capacity`, `duration_access`
- provisioning idempotency key
- expiry model for purchased quota packs/add-ons
- additive quota calculation across plan + grants + overrides

Decision for Subphase C:

- Keep current plan entitlements as baseline.
- Add grants as additive ledger entries.
- Provision grants server-side only after paid order.
- Never let the client choose final amount, discount, entitlement, or grant payload.

## Current Schema Inventory

Existing customer/account/admin tables:

- `user_profiles`
- `admin_users`
- `admin_audit_logs`
- `security_events`
- `support_access_logs`
- `user_quota_overrides`
- `user_feature_overrides`
- `user_onboarding_profiles`
- `user_activation_progress`
- `user_activity_daily`
- `user_health_scores`
- `notifications`
- `user_settings`

Existing billing/revenue tables:

- `subscriptions`
- `payments`
- `payment_events`
- `subscription_events`
- `payment_requests`
- `payment_gateway_transactions`
- `cancellation_requests`
- `upgrade_interests`
- `revenue_snapshots_daily`

Existing user-owned sales/productivity tables:

- `leads`
- `lead_notes`
- `reminders`
- `tags`
- `lead_tags`
- `task_events`
- `cadence_templates`
- `cadence_steps`
- `lead_cadences`
- `cadence_task_links`
- `import_jobs`
- `import_rows`
- `export_jobs`
- `templates`
- `template_categories`
- `template_favorites`
- `lead_saved_views`
- `lead_pipeline_events`
- `lead_view_events`
- `map_searches`
- `daily_usage_limits`
- `sales_activity_daily`
- `sales_goals`
- `sales_goal_events`
- `sales_analytics_snapshots`
- `ai_requests`
- `ai_saved_outputs`

Existing beta/ops tables:

- `beta_signups`
- `beta_feedback`
- `beta_checklist_progress`
- `beta_cohorts`
- `beta_cohort_members`
- `beta_invite_codes`
- `beta_invite_redemptions`
- `feature_flags`
- `user_feature_flags`
- `qa_checklists`
- `in_app_surveys`
- `onboarding_feedback`

Missing Phase 2E2 tables:

- customer CRM extension: `customer_admin_profiles`, `customer_tags`, `customer_tag_assignments`, `customer_notes`, `customer_lifecycle_events`
- orders/catalog: `orders`, `order_items`, `products`, `product_prices`, `features`, `product_features`, `entitlement_grants`, `order_events`
- tickets: `support_tickets`, `support_ticket_messages`, `support_ticket_categories`, `support_ticket_events`, `support_ticket_assignments`
- CMS: `cms_posts`, `cms_pages`, `cms_categories`, `cms_tags`, `cms_tag_assignments`, `cms_media`, `cms_revisions`, `cms_redirects`, `cms_preview_tokens`

## Existing Support/Feedback

Current support-like module:

- `/app/feedback`
- `/admin/feedback`
- `beta_feedback`
- `onboarding_feedback`
- feedback-related admin data helpers

This is not a ticket system. It lacks ticket code, assignment, categories, public/user conversation thread, internal notes, SLA, status transitions, support queue, and ticket events.

Subphase D should build tickets as a new module while optionally linking feedback records into ticket creation later. Do not repurpose beta feedback tables as core support ticket storage.

## Existing CMS/SEO

Current public SEO files:

- `app/sitemap.ts`
- `app/robots.ts`
- public policy pages
- landing page metadata in `app/layout.tsx` and route metadata

Missing CMS/blog:

- no `/blog`
- no `/blog/[slug]`
- no `/pages/[slug]`
- no `/admin/cms`
- no post/page/editor/media/revision/redirect tables
- no CMS editor dependency in `package.json`
- no media storage abstraction found for CMS uploads
- no RSS route
- no dynamic CMS sitemap entries
- no scheduled CMS publish cron

Subphase E should add CMS without copying WordPress source/UI/assets. The goal is to model useful editorial workflows, not replicate WordPress implementation.

## Modules That Can Be Reused

Admin:

- `AdminShell`
- `AdminPageHeader`
- `AdminTable`
- `AdminPagination`
- `AdminFilterBar`
- `AdminKpiCard`
- `AdminStatusBadge`
- `AdminField`
- `AdminEmptyState`
- `AdminInlineUpdateForm`
- admin auth and API guard helpers
- admin audit/security event writers

User app:

- `AppShell`
- notification helpers
- billing status badges/history/current-plan components
- existing UI primitives: `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Select`, `Tabs`, `Pagination`, `Drawer`, `Modal`, `BottomSheet`, `Tooltip`, `SearchInput`, `StatCard`

Billing:

- provider abstraction
- payment state transition helper
- payOS webhook normalization/signature verification
- manual/VietQR provider
- subscription activation/idempotency flow

Security:

- `guardMutationRequest`
- `rateLimit`
- `enforceSameOrigin`
- safe error helpers
- safe metadata sanitizer

SEO:

- `getSiteUrl()`
- existing sitemap/robots pattern
- GA/Search Console integration

## Modules That Need Refactor Before Scale

Admin customer list/dashboard:

- Replace first-page auth list and in-memory joins with server-side paging/aggregates.
- Use database indexes for customer lifecycle/status/plan/ticket/order filters.
- Avoid N+1 counts for orders/tickets/usage.

Admin navigation:

- Move from flat nav to grouped IA only after server permissions and real routes exist.
- Add new icon keys only when corresponding routes exist.

Admin permissions:

- Extend roles and granular permissions before finance/support/content routes.
- Suggested roles: `super_admin`, `admin`, `finance`, `support`, `content_editor`, `content_publisher`.
- Role migration must be backwards-compatible with current `support/admin/super_admin`.

Billing/entitlements:

- Keep existing subscription behavior intact.
- Add orders/catalog/grants beside current billing, then gradually route add-on checkout through orders.
- Keep legacy `payment_requests` and `payment_gateway_transactions` read-only compatibility until fully retired.

Security scan:

- Extend scan rules for order amount/client price schema, ticket content analytics leakage, CMS unsafe HTML/SVG/redirect handling, and cron secret checks.

## Proposed Migrations

Subphase B migration: `supabase/admin-customer-crm.sql`

- `customer_admin_profiles`
- `customer_tags`
- `customer_tag_assignments`
- `customer_notes`
- `customer_lifecycle_events`
- indexes for lifecycle, owner, tags, and user id
- RLS policies for admin-only access
- no access to user-owned private lead fields

Subphase C migration: `supabase/orders-product-catalog.sql`

- `products`
- `product_prices`
- `features`
- `product_features`
- `orders`
- `order_items`
- `order_events`
- `entitlement_grants`
- immutable price constraints
- minimum paid order constraint: no paid total from 1 to 49,999 VND
- idempotency constraints for provisioning
- user-own select policies for own orders and grants

Subphase D migration: `supabase/support-tickets.sql`

- `support_ticket_categories`
- `support_tickets`
- `support_ticket_messages`
- `support_ticket_events`
- `support_ticket_assignments`
- optional attachment metadata table only after storage policy is defined
- user-own RLS for public ticket messages
- admin/support policies for assigned/read scope

Subphase E migration: `supabase/seo-cms.sql`

- `cms_posts`
- `cms_pages`
- `cms_categories`
- `cms_tags`
- `cms_tag_assignments`
- `cms_media`
- `cms_revisions`
- `cms_redirects`
- `cms_preview_tokens`
- RLS/permissions for content editor and publisher roles
- constraints for slugs, status, redirect safety, scheduled publish fields

Optional permission migration: `supabase/admin-permissions-2e2.sql`

- extend allowed admin roles
- add permission-compatible seed rows if the DB stores role grants in the future
- keep existing `admin_users` records valid

## Data Privacy Guardrails

Customer CRM may display:

- account profile
- auth email
- account status
- lifecycle
- plan/subscription summary
- orders/payments
- add-ons/entitlement grants
- usage and quota aggregates
- support tickets
- notifications metadata
- admin notes and tags
- account-level audit/security events

Customer CRM must not display by default:

- lead phone
- lead email
- detailed lead address
- lead notes
- task content
- cadence content
- raw import rows
- raw map provider payloads

Current `support_access_logs` records support access but is not a full break-glass authorization workflow because it does not enforce super-admin-only access, reason validation, expiry, or scoped session grants. Do not implement private lead access in Phase 2E2 until that workflow is explicitly designed.

## Security Risks

- Expanding admin routes without permission granularity could let support perform finance/content actions.
- Customer 360 can accidentally become a BOLA/IDOR surface if all user ids are accepted without server-side permission checks.
- Ticket messages and CMS drafts are sensitive text surfaces and must not be logged or sent to analytics.
- CMS content can introduce XSS if stored/rendered HTML is not sanitized.
- CMS media can introduce stored XSS or malware if MIME/signature validation is weak, especially SVG.
- Redirect management can create open redirects or loops.
- Order creation can become revenue fraud if client-provided amount/discount/entitlement is accepted.
- payOS/VietQR processing must stay idempotent when webhooks or manual confirmation repeat.

## Performance Risks

- Current admin overview and user list fetch broad data and count in memory.
- Customer filters by plan/lifecycle/ticket/order require indexed server-side queries.
- Customer 360 should fetch sections independently and tolerate partial section errors.
- Ticket lists must not load entire conversations.
- CMS post lists must not load full article bodies.
- Charts and editors should be dynamic imports, not part of dashboard/user app bundles.
- Admin CRM must not import Google Maps.
- Public blog must not import admin CMS/editor code.

## Regression Risks

- Existing `/admin/users/[userId]` is currently the closest Customer 360 page. New `/admin/customers/[userId]` must not break or duplicate it without a redirect/transition plan.
- Existing billing checkout/success/cancel routes must keep plan subscription purchases working.
- Existing `payment_requests` and `payment_gateway_transactions` legacy history must remain viewable until retirement.
- Existing quota overrides and feature overrides must remain effective after entitlement grants are added.
- Existing sitemap/robots must continue to exclude `/admin`, `/app`, and `/api`.
- Existing feedback module must not be removed when tickets are introduced.

## Subphase Rollout Plan

Subphase B: Admin CRM

- Add customer CRM tables and permissions.
- Add server-side customer aggregate/list query.
- Add `/admin/customers` with pagination and filters.
- Add `/admin/customers/[userId]` Customer 360 using only safe account/billing/usage/ticket summaries.
- Add customer notes/tags/lifecycle events with audit logging.
- Keep `/admin/users` working; optionally link to Customer 360.
- Extend admin dashboard KPIs using aggregate queries only.

Subphase C: Orders and Catalog

- Add catalog/feature/order/grant schema.
- Add immutable price version model.
- Add `isValidOrderTransition(from, to)`.
- Add server-only order creation from active product/price.
- Enforce minimum paid order of 50,000 VND.
- Link order to payment through a nullable `order_id` or safe compatibility bridge.
- Provision entitlements from paid orders idempotently.
- Add `/admin/orders`, `/admin/catalog/*`, `/app/billing/orders`, and `/app/billing/add-ons`.

Subphase D: Support Tickets

- Add ticket schema, permissions, SLA calculation, and notification hooks.
- Add user routes `/app/support`, `/app/support/new`, `/app/support/[ticketId]`.
- Add admin routes `/admin/tickets`, `/admin/tickets/[ticketId]`, and settings.
- Enforce user-own access and hide internal notes from users.
- Add rate limits for create/reply.

Subphase E: SEO CMS

- Add CMS schema and permissions.
- Choose editor library after dependency review. TipTap or Lexical are acceptable if no existing editor exists.
- Add admin CMS routes and public `/blog`, `/blog/[slug]`.
- Add sanitization, media validation, preview tokens, scheduled publish cron, sitemap entries, JSON-LD, and optional RSS.
- Add redirect validation and loop detection.

Subphase F: Readiness

- Extend `security:scan`.
- Add focused automated tests for roles, IDOR, order amount enforcement, idempotency, tickets, CMS sanitization, and redirects.
- Run responsive QA for required viewports.
- Run full regression for auth, dashboard, discovery, leads, tasks, pipeline, cadence, import, analytics, billing, notifications, admin, payOS webhook, tickets, and CMS.

## Acceptance Gate For Subphase A

Subphase A is complete when:

- This audit exists.
- Pricing/feature pack recommendation exists.
- Handoff is updated.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run security:scan` passes.
- `npm run build` passes.
- Changes are committed and pushed.
