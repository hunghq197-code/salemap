# SaleMap Admin Operations Audit

Date: 2026-08-04, Asia/Saigon

Conclusion: PASS WITH KNOWN ISSUES

Scope: Phase 2E2 Admin Operations Completion. This phase completes the admin control center without changing user-facing Map, Lead, Task, Cadence, Import, Analytics, billing webhook, quota enforcement, or subscription core logic except where admin-operation guards were tightened.

## Pre-Implementation Gate

Files reviewed when present:

- `UI_AUDIT_REPORT.md`
- `UI_PHASE_2A_REPORT.md`
- `UI_PHASE_2B_REPORT.md`
- `UI_PHASE_2C1_REPORT.md`
- `UI_PHASE_2C2_REPORT.md`
- `UI_PHASE_2D_BILLING_REPORT.md`
- `API_MODULE_AUDIT.md`
- `ADMIN_CRM_CATALOG_TICKETS_CMS_AUDIT.md`
- `ADMIN_CRM_SUBPHASE_B_REPORT.md`
- `ORDERS_CATALOG_SUBPHASE_C_REPORT.md`
- `SUPPORT_TICKETS_SUBPHASE_D_REPORT.md`
- `SEO_CMS_SUBPHASE_E_REPORT.md`
- `PHASE_2E2_PRODUCTION_READINESS.md`

Files requested but not found in the repository:

- `MOBILE_RELEASE_GATE.md`
- `MOBILE_RECOVERY_AUDIT.md`
- `MOBILE_STABILIZATION_RELEASE_REPORT.md`
- `UI_PHASE_2E1_SETTINGS_NOTIFICATIONS_REPORT.md`

Because `MOBILE_RELEASE_GATE.md` does not exist, there was no Blocker/Critical conclusion available to stop on. This is recorded as a known issue, not treated as a pass.

## Admin Routes

Completed or reviewed routes:

- `/admin`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/payments`
- `/admin/payments/[paymentId]`
- `/admin/subscriptions`
- `/admin/subscriptions/[subscriptionId]`
- `/admin/usage`
- `/admin/quotas`
- `/admin/feedback`
- `/admin/security-events`
- `/admin/audit-logs`
- `/admin/system`
- `/admin/settings`

Additional existing admin modules kept in navigation under extended operations:

- `/admin/customers`
- `/admin/orders`
- `/admin/catalog`
- `/admin/tickets`
- `/admin/cms`
- `/admin/payment-requests`

New route created:

- `/admin/security-events`

## Admin APIs Reviewed

Reviewed API groups:

- `/api/admin/dashboard`
- `/api/admin/users`
- `/api/admin/users/[userId]`
- `/api/admin/users/[userId]/suspend`
- `/api/admin/users/[userId]/unsuspend`
- `/api/admin/users/[userId]/quota`
- `/api/admin/users/[userId]/features`
- `/api/admin/payments`
- `/api/admin/payments/[paymentId]`
- `/api/admin/payments/[paymentId]/mark-paid`
- `/api/admin/payments/[paymentId]/mark-failed`
- `/api/admin/payments/[paymentId]/cancel`
- `/api/admin/subscriptions`
- `/api/admin/subscriptions/[subscriptionId]`
- `/api/admin/subscriptions/[subscriptionId]/extend`
- `/api/admin/subscriptions/[subscriptionId]/change-plan`
- `/api/admin/subscriptions/[subscriptionId]/grant-trial`
- `/api/admin/subscriptions/[subscriptionId]/cancel`
- `/api/admin/usage`
- `/api/admin/quotas`
- `/api/admin/feedback`
- `/api/admin/feedback/[id]`
- `/api/admin/security-events`
- `/api/admin/security-events/[eventId]/resolve`
- `/api/admin/audit-logs`
- `/api/admin/system`
- `/api/admin/customers`
- `/api/admin/customers/[userId]`
- `/api/admin/tickets/[ticketId]`
- `/api/admin/tickets/[ticketId]/messages`
- `/api/admin/payment-requests/[id]/approve`
- `/api/admin/payment-requests/[id]/reject`
- `/api/admin/payment-gateway/[id]/sync`

Guard model:

- Direct admin APIs use `handleAdminApi` and a concrete `ADMIN_PERMISSIONS` value.
- Older delegated admin APIs keep same-origin/rate-limit guards and call reviewed admin helpers that require server-side permissions.
- `scripts/security-scan.mjs` now checks admin API guard coverage and raw sensitive admin UI rendering.

## Permission Model

Role source: `admin_users`.

Roles:

- `support`
- `admin`
- `super_admin`

Permissions are centralized in `lib/admin/admin-permissions.ts` and enforced server-side through `requirePermission`, `requireAdmin`, and `handleAdminApi`.

Support role:

- Can read dashboard, customers, customer detail, catalog, feedback, orders, tickets, payments, usage, users, and user detail.
- Cannot mutate tickets, customer lifecycle, customer notes, customer tags, catalog, orders, CMS, payments, subscriptions, quota, user status, system settings, admin users, or security-event resolution.

Admin role:

- Can operate users, payments, subscriptions, quota, usage, feedback, tickets, catalog, orders, CMS, audit logs, security events, and system health according to assigned permissions.
- Cannot manage admin users or system settings by default.

Super admin role:

- Has all admin-operation permissions.

RLS hardening:

- `supabase/admin-customer-crm.sql` now keeps support read-only for CRM objects.
- `supabase/support-tickets.sql` now keeps support read-only for ticket objects.
- `supabase/admin-security.sql` no longer lets support insert audit/support-access logs directly through client RLS.

## Components Reviewed Or Added

Existing:

- `components/admin/AdminShell.tsx`
- `components/admin/AdminTable.tsx`
- `components/admin/AdminFilterBar.tsx`
- `components/admin/AdminPagination.tsx`
- `components/admin/AdminKpiCard.tsx`
- `components/admin/AdminStatusBadge.tsx`
- `components/admin/AdminInlineUpdateForm.tsx`

Added:

- `components/admin/AdminConfirmSubmitButton.tsx`
- `components/admin/dashboard/AdminAlertCenter.tsx`
- `components/admin/dashboard/AdminAlertItem.tsx`

## Tables Used

Admin/security:

- `admin_users`
- `admin_audit_logs`
- `security_events`
- `support_access_logs`

Users/usage:

- `auth.users`
- `user_profiles`
- `user_activation_progress`
- `user_onboarding_profiles`
- `daily_usage_limits`
- `user_quota_overrides`
- `user_feature_overrides`

Billing:

- `payments`
- `payment_events`
- `payment_requests`
- `payment_gateway_transactions`
- `subscriptions`
- `subscription_events`

Operations:

- `import_jobs`
- `beta_feedback`
- `upgrade_interests`
- `support_tickets`
- `support_ticket_messages`
- `support_ticket_events`
- `customer_admin_profiles`
- `customer_tags`
- `customer_tag_assignments`
- `customer_notes`
- `orders`
- `order_items`
- `order_events`
- `features`
- `products`
- `product_prices`
- `product_features`
- `entitlement_grants`
- `cms_posts`
- `cms_pages`
- `cms_redirects`

## What Was Completed

Admin Dashboard:

- Rebuilt `/admin` around six operations KPIs only.
- Removed unreliable revenue KPI from the dashboard.
- Added action-first sections for alerts, ticket queue, recent audit, recent users, and system health.
- Added `AdminAlertCenter` fed by real database signals such as pending payments, failed payments, import failures, unresolved security events, suspended users, and expiring subscriptions.

Admin Navigation:

- Reordered admin IA into operations-console priorities.
- Added real `/admin/security-events` navigation.
- Filters nav items by permission client-side while keeping server authorization as source of truth.
- Mobile admin bottom nav prioritizes dashboard, users, payments, and security events for emergency checks.

Security Events:

- Added `/admin/security-events`.
- Added server-side `VIEW_SECURITY_EVENTS` and `RESOLVE_SECURITY_EVENTS`.
- Separated read from resolve permission.
- Added confirmation before resolving events.
- Resolve revalidates both audit logs and security events.

User Operations:

- Suspend/reactivate now require server-side `UPDATE_USER_STATUS`.
- Suspend requires a bounded reason and rejects likely secret-like text.
- Suspend cannot target the current admin.
- Suspend blocks the last active super admin.
- Suspend writes admin audit log and a warning security event.
- User detail UI now requires reason and confirmation for suspend/reactivate.

Payment Operations:

- Kept payment core in `lib/billing/payments.ts`.
- Added confirmation UI for mark paid, mark failed, and cancel on `/admin/payments`.
- Existing core still handles payment transition validation and idempotency.

Subscription Operations:

- Kept subscription core in `lib/billing/subscriptions.ts`.
- Added confirmation UI for extend, grant trial, downgrade, and cancel on subscription detail.
- Existing core still writes subscription events and admin audit logs.

Usage And Quota:

- Added confirmation UI for quota/feature override save and removal.
- Existing quota helpers keep `UPDATE_QUOTA` server-side checks and audit logs.

Feedback:

- Existing filtered/paginated feedback operations were reviewed.
- Admin feedback update still uses `AdminInlineUpdateForm` and server-side API guards.

Audit Logs:

- Existing `/admin/audit-logs` was reviewed.
- Audit/security metadata is sanitized before display.
- Security event resolve now also refreshes `/admin/security-events`.

System Health:

- Existing `/admin/system` was reviewed.
- Dashboard links to system health instead of duplicating provider/env detail.

Settings/Feature Flags:

- Existing `/admin/settings` remains super-admin/system-settings gated through navigation and server permissions.
- No new feature flag schema was introduced.

## Mutations With Audit Logs

- User status update.
- Payment mark paid, mark failed, cancel.
- Subscription extend, change plan/downgrade, cancel, grant trial.
- Quota override set/remove.
- Feature override set/remove.
- Feedback status/priority update.
- Customer lifecycle/tags/notes from existing CRM.
- Ticket updates/replies for admin/super_admin.
- CMS mutations from existing CMS module.
- Security event resolve.

## Mutations Creating Security Events

- Unauthorized admin access/permission attempts.
- Admin API rate-limit events.
- Invalid payOS webhooks.
- Payment amount mismatch.
- Admin user suspension.

## Files Created

- `ADMIN_OPERATIONS_AUDIT.md`
- `app/admin/security-events/page.tsx`
- `components/admin/AdminConfirmSubmitButton.tsx`
- `components/admin/dashboard/AdminAlertCenter.tsx`
- `components/admin/dashboard/AdminAlertItem.tsx`

## Files Updated

- `app/admin/audit-logs/actions.ts`
- `app/admin/page.tsx`
- `app/admin/payments/page.tsx`
- `app/admin/quotas/page.tsx`
- `app/admin/subscriptions/[subscriptionId]/page.tsx`
- `app/admin/users/[userId]/page.tsx`
- `app/admin/users/actions.ts`
- `app/api/admin/security-events/route.ts`
- `app/api/admin/security-events/[eventId]/resolve/route.ts`
- `app/api/admin/users/[userId]/suspend/route.ts`
- `app/api/admin/users/[userId]/unsuspend/route.ts`
- `components/admin/AdminShell.tsx`
- `lib/admin/admin-permissions.ts`
- `lib/admin/data/overview.ts`
- `lib/admin/data/security.ts`
- `lib/admin/data/users.ts`
- `lib/design-system/navigation.ts`
- `scripts/phase-2e2-regression.mjs`
- `scripts/security-scan.mjs`
- `supabase/admin-security.sql`
- `supabase/admin-customer-crm.sql`
- `supabase/support-tickets.sql`

## SQL To Apply

No new table schema is introduced in this phase.

If these SQL files were already applied in staging/production, rerun or apply the policy diffs from:

- `supabase/admin-security.sql`
- `supabase/admin-customer-crm.sql`
- `supabase/support-tickets.sql`

Purpose: tighten support role write access and keep support read-only for Admin Operations.

## Env Changes

No new environment variables are required.

## Automated Tests Added Or Updated

- Updated `scripts/security-scan.mjs`.
- Updated `scripts/phase-2e2-regression.mjs`.

## Known Issues And Deferred Items

- `MOBILE_RELEASE_GATE.md` is missing, so mobile gate status could not be verified from the requested file.
- Authenticated browser QA was not run because no seeded admin/support/user sessions were available in this task.
- `npm run test` and `npm run test:e2e` do not exist in `package.json`; results must be reported as unavailable, not pass.
- `getAdminUsers` and `getAdminUserDetail` still use `listAuthUsers()` and several `listUserIdRows(...).limit(10000)` aggregate helpers. This is acceptable for current small/admin MVP data, but not for large production tenants.
- Some admin tables still use horizontal scroll instead of a full mobile card fallback.
- Role management UI was not implemented because product scope for admin role changes is not established.
- No Public Beta gate was opened.

## Production Risks Remaining

- Apply the RLS policy updates before relying on support read-only in production.
- Add authenticated E2E tests with seeded `super_admin`, `admin`, `support`, and normal user accounts.
- Replace in-memory aggregate admin user queries before large-scale production use.
- Run mobile/tablet visual QA against authenticated admin pages once staging credentials exist.

## Public Beta Recommendation

Do not open Public Beta automatically.

Recommended next gate: create a separate Public Beta Release Gate after authenticated staging QA passes for admin/user roles, payment operations, webhook reconciliation, quota enforcement, and mobile core workflows.
