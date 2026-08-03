# SaleMap Pricing And Feature Pack Recommendation

Date: 2026-08-03, Asia/Saigon

Status: initial pricing hypothesis for Phase 2E2. This is not a final finance model and must be validated against real provider invoices, usage logs, and conversion data before production pricing changes.

## Sources Consulted

Official pricing pages checked for cost assumptions:

- Google Maps Platform pricing: https://developers.google.com/maps/billing-and-pricing/pricing
- Google Places usage and billing: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- Supabase pricing: https://supabase.com/pricing
- Vercel pricing: https://vercel.com/pricing
- payOS homepage/pricing claim: https://payos.vn/
- OpenAI GPT-4.1 API pricing reference, if SaleMap AI uses OpenAI-compatible models: https://openai.com/index/gpt-4-1/

Prices can change. Re-check the official pages and provider dashboards before changing live plans.

## Current Source-Of-Truth In Code

`lib/constants/subscription-plans.ts` currently defines:

| Plan | Current price | Key included quotas |
| --- | ---: | --- |
| Free | 0 VND/month | 10 near-me/day, 10 area/day, 3 route/day, 100 saved map leads, 1 import/month, 1 export/day, 0 AI/day |
| Pro | 149,000 VND/month | 100 near-me/day, 100 area/day, 30 route/day, 3,000 saved map leads, 20 import/month, 20 export/day, 30 AI/day |
| Pro Plus | 399,000 VND/month | 500 near-me/day, 500 area/day, 100 route/day, 20,000 saved map leads, 100 import/month, 100 export/day, 200 AI/day |

The Phase 2E2 brief mentions Pro Plus at 349,000 VND, but the current code source-of-truth is 399,000 VND. Do not change the production price until the catalog has immutable price records and the business owner confirms the active price.

## Cost Risk Snapshot

The biggest margin risk is Google Maps/Places usage.

Current implementation notes:

- Near-me and area search call Places Text Search (New).
- Area search also calls Geocoding.
- Route search calls Directions and then samples up to 6 route points, each calling Places Text Search.
- Place details can add another Places Details call when contact details are loaded.

Provider pricing risk using current public Google tiers:

- Places API Text Search Pro lists a 5,000 monthly free usage cap, then a first paid tier around USD 32 per 1,000 billable events.
- Places API Nearby Search Pro is also in the high-cost Places Pro family.
- Places Details Pro lists a first paid tier around USD 17 per 1,000 billable events.
- Geocoding and Routes Essentials list 10,000 monthly free usage caps and lower first paid tiers around USD 5 per 1,000 events.

This means the current Pro and Pro Plus quota ceilings are not economically safe if every allowed daily action results in a live Google API billable event and users regularly hit limits.

Approximate worst-case API call pressure:

| Plan | Daily search allowance pressure | Monthly implication |
| --- | --- | --- |
| Pro | 100 near-me + 100 area + 30 route * up to 6 text searches = up to 380 Places text searches/day before place details | Up to about 11,400 Places text searches/month/user |
| Pro Plus | 500 near-me + 500 area + 100 route * up to 6 text searches = up to 1,600 Places text searches/day before place details | Up to about 48,000 Places text searches/month/user |

Conclusion: the current quota ceilings should be treated as beta/growth ceilings, not sustainable commercial entitlements, unless SaleMap adds caching, deduplication, hard cost caps, fair-use throttles, and/or higher pricing.

## Pricing Principles

1. Keep base plans simple: Free, Pro, Pro Plus.
2. Do not sell "unlimited" Google Maps, AI, import, export, or support.
3. Put high-variable-cost features into metered packs.
4. Minimum paid order: 50,000 VND.
5. Server must own price, discount, quota, and entitlement decisions.
6. Product prices must be immutable once used by paid orders.
7. Existing customers should keep their historical order snapshots even when prices change.
8. Admin can configure catalog, but catalog changes must be audited.
9. Every add-on must have an expiry/renewal policy.
10. Add-on grants must be idempotent.

## Recommended Base Plans

### Free

Purpose: onboarding and trust-building, not heavy production usage.

Recommended:

- Keep price at 0 VND.
- Reduce or monitor live Places cost exposure carefully.
- Keep AI at 0/day.
- Keep import/export low.
- Use prompts inside product to explain upgrade value, not artificial data locks.

Cost guard:

- Use cached search results when possible.
- Consider soft daily cost budget per free user.

### Pro

Purpose: individual salesperson using SaleMap frequently.

Current price: 149,000 VND/month.

Recommendation:

- Keep the price initially only if live Google cost is controlled.
- Reduce live Places-heavy quotas before broad paid acquisition, or move extra map searches into add-on packs.
- Keep AI included at a modest quota.
- Include standard support, not strict priority SLA unless economics are known.

Suggested positioning:

- Daily sales workflow.
- Lead discovery starter capacity.
- Import/export for individual work.
- Basic analytics and cadence.

### Pro Plus

Purpose: high-usage individual or B2B salesperson.

Current code price: 399,000 VND/month.
Brief hypothesis: 349,000 VND/month.

Recommendation:

- Keep 399,000 VND as active source-of-truth until a business decision changes it.
- If 349,000 VND is desired, create it as a new immutable price version after catalog exists.
- Do not keep the current 500/500/100 daily map search ceilings without hard provider cost controls.

Suggested positioning:

- Higher discovery capacity.
- Higher import/export.
- Higher AI allowance.
- Advanced analytics.
- Priority support eligibility.

## Recommended Add-On Catalog

All paid add-ons must be at least 50,000 VND.

| Add-on | Product type | Suggested price | Grant type | Expiry policy |
| --- | --- | ---: | --- | --- |
| Map Search Pack S | `quota_pack` | 50,000 VND | quota | 30 days |
| Map Search Pack M | `quota_pack` | 99,000 VND | quota | 30 days |
| Route Search Pack | `quota_pack` | 79,000 VND | quota | 30 days |
| Lead Save Capacity Pack | `quota_pack` | 50,000 VND | capacity | billing period or 30 days |
| Import Pack | `quota_pack` | 50,000 VND | quota | 30 days |
| Cadence Automation Pack | `recurring_addon` | 79,000 VND/month | boolean + quota | subscription period |
| AI Assistant Pack S | `quota_pack` | 50,000 VND | quota | 30 days |
| AI Assistant Pack M | `quota_pack` | 99,000 VND | quota | 30 days |
| Advanced Analytics | `recurring_addon` | 99,000 VND/month | boolean_access | subscription period |
| Priority Support | `recurring_addon` | 99,000 VND/month | duration_access | subscription period |
| Onboarding Service | `service_package` | from 300,000 VND | service entitlement | one-time |

Exact quota amounts should be calculated from observed usage and provider invoices. The table above only defines the packaging structure and minimum viable commercial shape.

## Feature Catalog Proposal

Feature categories:

- `map`
- `leads`
- `tasks`
- `cadence`
- `import`
- `analytics`
- `ai`
- `support`
- `account`

Initial feature keys:

| Feature key | Category | Metered? | Notes |
| --- | --- | --- | --- |
| `map.near_me_search` | map | yes | high Google Places cost risk |
| `map.area_search` | map | yes | includes Geocoding + Places |
| `map.route_search` | map | yes | can fan out to multiple Places calls |
| `map.place_details` | map | yes | phone/website/rating details cost risk |
| `leads.save_map_lead` | leads | yes | storage and value-based cap |
| `leads.manual_lead` | leads | optional | should usually remain generous |
| `tasks.task_capacity` | tasks | yes | database/storage cost, low variable provider cost |
| `cadence.active_count` | cadence | yes | productivity value pack |
| `import.rows` | import | yes | CPU/storage/support risk |
| `export.daily_count` | import | yes | abuse/spam/export risk |
| `analytics.advanced` | analytics | boolean | product value unlock |
| `ai.request` | ai | yes | provider variable cost |
| `support.priority` | support | duration_access | SLA driver |
| `account.owner_support` | account | boolean | service/package value |

## Order And Entitlement Policy

Order:

- Represents what the customer bought.
- Stores price and entitlement snapshots.
- Has server-validated status transitions.
- Has total amount calculated by server.

Payment:

- Represents provider transaction and confirmation state.
- Links to order.
- Does not decide entitlement by itself.

Subscription:

- Represents recurring plan access.
- Baseline entitlements come from active plan.

Entitlement grant:

- Represents access/quota granted by subscription, add-on purchase, admin override, or promotion.
- Created only server-side.
- Created only after paid order or explicit admin override.
- Must use an idempotency key.

Minimum amount:

- Any paid order from 1 to 49,999 VND is invalid.
- Zero VND orders are allowed only for explicit admin/promotion/internal cases and must be audited.

## Recommended Margin Model

Track gross margin by user, plan, and feature pack:

```text
gross_margin =
  collected_revenue
  - payment_provider_fees
  - google_maps_cost
  - ai_provider_cost
  - hosting_compute_cost
  - database_storage_egress_cost
  - support_labor_cost
  - tax_or_vat_allowance
```

Track these operational metrics before broad paid scaling:

- Places Text Search calls per active user.
- Route search fan-out count per route search.
- Place details calls per saved lead.
- AI requests and tokens per user.
- Import rows per user.
- Export rows per user.
- Support tickets per paying user.
- Refund/manual adjustment rate.
- Payment confirmation time by provider.
- Plan conversion and add-on attach rate.

## Admin Configuration Requirements

Admin Catalog should eventually support:

- product name, type, status
- public visibility
- eligibility by plan
- active/inactive prices
- immutable historical prices
- feature grant templates
- quota amount and expiry
- display ordering
- audit log for all mutations

Do not allow:

- arbitrary CSS colors for tags/products
- client-provided prices
- negative or tiny paid prices
- direct SQL-style JSON grant payload from UI
- support role editing prices
- content role viewing billing/catalog mutation screens

## Launch Recommendation

For the next implementation phases:

1. Build catalog/order/grant infrastructure before selling add-ons.
2. Keep existing Pro 149,000 VND and Pro Plus 399,000 VND as code source-of-truth until versioned prices exist.
3. Add map/AI cost observability before raising quotas.
4. Move heavy map usage into add-on packs and fair-use gates.
5. Use payOS or VietQR for checkout, but keep order/payment/grant separation so providers can change later.
6. Revisit exact prices after 2-4 weeks of real usage data.
