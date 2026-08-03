# Phase 2E2 Subphase C - Orders, Catalog, Add-ons

Date: 2026-08-03, Asia/Saigon.

## Scope Delivered

- Added the product and feature catalog foundation:
  - `features`
  - `products`
  - `product_prices`
  - `product_features`
- Added order management foundation:
  - `orders`
  - `order_items`
  - `order_events`
  - `payments.order_id`
- Added entitlement grant foundation:
  - `entitlement_grants`
  - idempotent provisioning by order item and feature key
  - active grant lookup wired into billing entitlements
- Added seeded add-ons with immutable price codes and server-owned entitlement templates:
  - Map Search Pack S - 50,000 VND
  - Route Search Pack S - 79,000 VND
  - AI Assistant Pack S - 50,000 VND
  - Advanced Analytics - 99,000 VND/month
  - Priority Support - 99,000 VND/month
- Added user routes:
  - `/app/billing/add-ons`
  - `/app/billing/orders`
- Added admin routes:
  - `/admin/catalog`
  - `/admin/orders`
  - `/admin/orders/[orderId]`
- Updated `/app/billing` with direct links to add-ons and orders.
- Updated admin navigation and permissions for catalog and order operations.
- Updated `SUPABASE_SQL_SETUP.md` with `supabase/orders-product-catalog.sql` as step 29.

## Security And Billing Decisions

- Client forms submit only `priceId`; amount, currency, product, and entitlement data are always loaded from the active server-side catalog.
- Paid add-on orders enforce a minimum amount of 50,000 VND.
- User order views are scoped to the current user.
- Admin/support permissions are split:
  - Support can view catalog and orders.
  - Admin/super admin can manage catalog and orders.
- Entitlement provisioning is idempotent through `entitlement_grants.idempotency_key`.
- Admin audit logs do not store raw provider payloads or private customer lead data.

## Deferred To Later Subphases

- payOS/VietQR checkout bridge for catalog orders.
- Admin catalog create/edit UI and mutation APIs.
- Refund, revoke, and partial fulfillment workflows.
- Support ticketing.
- SEO/content CMS.

## Validation

```powershell
npm run typecheck
npm run lint
npm run security:scan
npm run build
npm run smoke
```

Results:

- Typecheck passed.
- Lint passed with 0 warnings and 0 errors.
- Security scan passed.
- Production build passed.
- Smoke test passed 40/40 checks.

## Deployment Note

Run this SQL file in Supabase after the existing setup files:

```text
supabase/orders-product-catalog.sql
```

The app intentionally shows schema readiness warnings on the new order/catalog pages until this SQL is applied.
