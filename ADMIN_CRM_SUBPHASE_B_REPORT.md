# SaleMap Phase 2E2 Subphase B Report

Date: 2026-08-03, Asia/Saigon

Scope: Admin CRM Dashboard, Customer List, Customer 360, customer lifecycle, internal notes, and customer tags.

## Implemented

### Database Migration

Added `supabase/admin-customer-crm.sql` with:

- `customer_admin_profiles`
- `customer_tags`
- `customer_tag_assignments`
- `customer_notes`
- `customer_lifecycle_events`
- indexes for lifecycle, email cache, owner, notes, tags, and lifecycle events
- RLS policies restricted to SaleMap admin roles
- allowed customer lifecycle values: `registered`, `activated`, `trial`, `paying`, `at_risk`, `churned`, `suspended`
- allowed customer tag color tokens: `slate`, `blue`, `green`, `yellow`, `red`, `purple`

### Permissions

Extended `lib/admin/admin-permissions.ts` with:

- `VIEW_CUSTOMERS`
- `VIEW_CUSTOMER_DETAIL`
- `MANAGE_CUSTOMER_LIFECYCLE`
- `MANAGE_CUSTOMER_NOTES`
- `MANAGE_CUSTOMER_TAGS`

Current behavior:

- `super_admin`: all permissions.
- `admin`: all except admin-user and system-settings management, following the existing role pattern.
- `support`: can view customers/detail and manage customer notes/tags, but cannot change lifecycle.

### Admin Navigation And Dashboard

Added `/admin/customers` to the admin sidebar.

Updated `/admin` with CRM/business KPIs sourced from existing billing data:

- active paid customers
- paid revenue
- pending/processing/waiting-confirmation payments

No order/ticket/CMS numbers are faked in this subphase.

### Customer List

Added `/admin/customers` with:

- KPI cards
- filters for account status, lifecycle, plan, subscription status, paid status, and created date range
- pagination
- Customer 360 links
- safe customer tags display
- aggregate usage counts only

Data access approach:

- Customer list pages from `user_profiles` with Supabase range pagination.
- Auth email is fetched only for users on the current page through Supabase Auth Admin.
- `customer_admin_profiles` stores safe email/full-name cache for CRM search and display.
- The implementation does not fetch private lead fields.

### Customer 360

Added `/admin/customers/[userId]` with:

- customer summary
- account and current plan
- subscription detail link
- aggregate lead/task/map/AI/import/payment/notification/security/support counts
- recent payments
- recent subscription events
- customer lifecycle update form
- customer tags
- customer internal notes
- usage/quota table
- lifecycle timeline
- placeholders for Orders and Tickets, explicitly deferred to Subphase C and D

Customer 360 privacy rule:

- Does not show lead phone.
- Does not show lead email.
- Does not show detailed lead address.
- Does not show lead note content.
- Does not show task/cadence content.
- Does not show raw import rows.
- Does not show raw map provider payloads.

### API Routes

Added:

- `GET /api/admin/customers`
- `GET /api/admin/customers/[userId]`
- `PATCH /api/admin/customers/[userId]`

Admin API routes use `handleAdminApi`, so non-GET mutations enforce same-origin, admin permission, and admin rate limiting.

## Files Created

- `ADMIN_CRM_SUBPHASE_B_REPORT.md`
- `app/admin/customers/page.tsx`
- `app/admin/customers/[userId]/actions.ts`
- `app/admin/customers/[userId]/page.tsx`
- `app/api/admin/customers/route.ts`
- `app/api/admin/customers/[userId]/route.ts`
- `lib/admin/data/customers.ts`
- `lib/validators/customer-admin.ts`
- `supabase/admin-customer-crm.sql`

## Files Updated

- `app/admin/page.tsx`
- `components/admin/AdminPageTracker.tsx`
- `components/admin/AdminShell.tsx`
- `lib/admin/admin-permissions.ts`
- `lib/admin/data/overview.ts`
- `lib/design-system/navigation.ts`
- `SUPABASE_SQL_SETUP.md`
- `CODEX_HANDOFF.md`

## Migration To Run

Run this after the existing billing architecture migration:

```sql
supabase/admin-customer-crm.sql
```

In the SQL setup checklist it is step 28.

## Deferred

Subphase C:

- Orders
- Product Catalog
- Feature Catalog
- Price versioning
- Entitlement grants
- Add-on checkout

Subphase D:

- Support tickets
- Ticket messages
- Ticket SLA
- Ticket notifications

Subphase E:

- SEO CMS
- Blog/public post routes
- Media library
- Revisions
- Redirects
- Scheduled publishing

## Validation

Subphase B validation commands and results:

```powershell
npm run typecheck      # pass
npm run lint           # pass
npm run security:scan  # pass
npm run build          # pass
npm run smoke          # pass, 40/40 checks
```
