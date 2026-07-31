# SaleMap UI Audit Report

Date: 2026-07-31  
Scope: Phase 1 - UI audit, design system foundation, app shell/admin shell/mobile navigation.  
Constraint: No new product feature, no route/API/database/business logic/auth/billing/admin behavior changes.

## Technology Snapshot

- Framework: Next.js 16 App Router, React 19, TypeScript.
- Styling: Tailwind CSS 3 with global CSS variables in `app/globals.css`.
- Backend/runtime integrations observed: Supabase SSR/client/admin, Google Maps provider, payOS/manual billing, PWA/offline helpers, PostHog analytics.
- UI icon set: `lucide-react`.
- Validation scripts available: `npm run lint`, `npm run typecheck`, `npm run security:scan`, `npm run build`, `npm run smoke`.

## Route Inventory

User app routes audited: 44 page routes under `/app`.

- Core workspace: `/app`, `/app/dashboard`, `/app/discover`, `/app/find`, `/app/leads`, `/app/leads/[leadId]`, `/app/pipeline`.
- Lead operations: `/app/leads/bulk-actions`, `/app/leads/cleanup`, `/app/leads/cleanup/duplicates`, `/app/leads/cleanup/duplicates/[groupId]`, `/app/leads/cleanup/quality`, `/app/leads/views`, `/app/leads/views/[viewId]`.
- Tasks/cadences: `/app/tasks`, `/app/reminders`, `/app/cadences`, `/app/cadences/new`, `/app/cadences/[cadenceId]`, `/app/cadences/[cadenceId]/edit`.
- Data/workflows: `/app/import`, `/app/import/[jobId]`, `/app/export`, `/app/templates`, `/app/analytics`, `/app/analytics/goals`, `/app/analytics/goals/new`, `/app/analytics/sources`.
- Account/support: `/app/billing`, `/app/billing/checkout`, `/app/billing/success`, `/app/billing/cancel`, `/app/billing/payment/[paymentRequestId]`, `/app/billing/payment/return`, `/app/billing/payment/cancel`, `/app/settings`, `/app/settings/billing`, `/app/notifications`, `/app/feedback`.
- Utility: `/app/ai-assistant`, `/app/huong-dan`, `/app/huong-dan-beta`, `/app/install`, `/app/offline`, `/app/onboarding`.

Admin routes audited: 29 page routes under `/admin`.

- Core/admin ops: `/admin`, `/admin/users`, `/admin/users/[userId]`, `/admin/subscriptions`, `/admin/payments`, `/admin/payment-requests`, `/admin/payment-gateway`, `/admin/quotas`, `/admin/usage`, `/admin/system`, `/admin/settings`.
- Security/support/data: `/admin/audit-logs`, `/admin/feedback`, `/admin/feature-flags`, `/admin/imports`, `/admin/invite-codes`, `/admin/lead-views`, `/admin/data-quality`, `/admin/qa`, `/admin/ai-usage`.
- Reporting/programs: `/admin/revenue`, `/admin/retention`, `/admin/sales-analytics`, `/admin/surveys`, `/admin/beta-signups`, `/admin/beta-cohorts`, `/admin/beta-cohorts/[cohortId]`, `/admin/upgrade-interests`.

Loading coverage exists for the main user flows and several admin pages. Admin gaps remain for some dense pages such as payments, quotas, usage, audit logs, beta cohorts, data quality, system/settings, and user detail.

## Design System Inventory

Keep and continue using:

- `components/ui/Button.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Card.tsx`
- `components/ui/PageHeader.tsx`
- `components/ui/SearchInput.tsx`
- `components/ui/StatCard.tsx`
- `components/ui/Toast.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/ErrorState.tsx`
- `components/ui/PageLoadingSkeleton.tsx`
- `components/app/AppShell.tsx`
- `components/admin/AdminShell.tsx`
- `lib/design-system/navigation.ts`

New foundation primitives added in this phase:

- Form controls: `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`.
- Overlays/navigation: `Modal`, `Drawer`, `BottomSheet`, `ConfirmDialog`, `DropdownMenu`, `Popover`, `Tooltip`.
- Utility/display: `IconButton`, `Avatar`, `Skeleton`, `SectionHeader`, `Tabs`, `FilterBar`, `Pagination`.
- Token helpers: `lib/design-system/tokens.ts`, `lib/design-system/status.ts`.

Refactor later:

- Inline form controls and CTA buttons in auth, billing, task, cadence, discovery, import/export, notification, onboarding, and lead pages.
- Inline modal implementations in task/cadence/billing/survey components.
- Admin tables/forms currently using repeated `rounded-lg border border-slate-200 bg-white` patterns.
- Public landing sections still using older `ink/ocean/mint/cloud` aliases and one-off shadows.

Remove later only after replacement is complete:

- Repeated arbitrary button classes such as `bg-mint ... hover:bg-[#5de0b3]`.
- Duplicate admin table/filter/pagination markup once a stronger table primitive is introduced.
- Legacy reminder UI surfaces if the `/app/reminders` redirect remains the long-term product direction.

## Token And Visual Findings

Implemented foundation tokens:

- Background/surface/sidebar/text/primary/accent/success/warning/danger/border.
- Radius tokens: `sm`, `md`, `lg`, `xl`, `full`, with `control`, `card`, `shell` Tailwind aliases.
- Shadow tokens: `card`, `elevated`, `modal`, with existing `soft`/`floating` aliases preserved.
- Legacy aliases `ink`, `ocean`, `mint`, `cloud` still map to token values so old screens keep rendering.

Remaining hardcoded color sources:

- Repeated CTA hover color `hover:bg-[#5de0b3]` across auth, tasks, billing, cadence, import/export, discovery, and lead components.
- Public landing sections use several arbitrary shadows and gradients.
- Google Maps rendering requires provider-compatible hex colors in `components/discovery/MapPreview.tsx`; keep these isolated to map rendering.
- Email templates, Open Graph image, manifest/theme color, and lead/tag seed colors use literal hex values by necessity or data semantics. These should be documented rather than blindly tokenized.

## Shell And Navigation Findings

Implemented/verified:

- User `AppShell` uses a dark desktop sidebar, grouped navigation, sticky topbar, mobile header, safe-area bottom padding, and no admin/chart/map imports in the shell.
- Admin `AdminShell` is separate from the user shell and keeps admin role/environment cues.
- Heavy user routes keep `prefetch={false}` behavior for discover/import/analytics/admin-related entries.
- Mobile dashboard navigation now has four primary tabs plus a real bottom sheet for More: Pipeline, Cadences, Import, Analytics, Billing, Settings, Feedback.

Guardrails:

- Do not import Google Maps components, chart-heavy analytics components, or admin-only components into `AppShell`.
- Keep admin navigation in `AdminShell`; user bundle should not pull admin pages/modules.
- Keep route hrefs unchanged unless a separate product routing task approves it.

## Responsive Findings

Current strengths:

- Shell containers use `min-w-0`, responsive padding, sticky mobile header, and safe-area spacing.
- Main mobile bottom nav uses fixed five-column dimensions, short labels, and tokenized active states.
- Dashboard has already been optimized for mobile in the previous sprint.

Remaining risks:

- Several admin tables use `min-w-[260px]` to `min-w-[360px]` cells and horizontal scrolling. This is acceptable short-term for ops, but Phase 2 should introduce responsive admin table/card patterns.
- Pipeline board intentionally scrolls horizontally; mobile needs visual affordance and column width review.
- Lead detail contains a separate mobile action rail; it should be reconciled with the global bottom nav in Phase 2.
- Long Vietnamese labels in cadence/billing/admin pages need truncation or wrapping standards to avoid overflow at 360px.

## Accessibility Findings

Implemented in foundation:

- Dialog primitives use `role="dialog"`, `aria-modal`, labelled title/description IDs, Escape close, body scroll lock, and focus containment.
- `IconButton` requires a visible `label` prop for `aria-label`.
- Form primitives expose `label`, `error`, `aria-invalid`, and `aria-describedby` patterns.

Remaining risks:

- Existing older forms often lack consistent `aria-describedby` for error/help text.
- Some admin/user tables need captions or clearer `scope`/header semantics.
- Existing status badges should not rely on color alone; add text labels where missing.
- Legacy modal implementations should be replaced gradually with `Modal`, `Drawer`, `BottomSheet`, or `ConfirmDialog`.

## Performance Findings

Current strengths:

- Shell imports stay lightweight and avoid Google Maps, admin page code, and analytics chart modules.
- Heavy route prefetch is disabled where earlier performance work identified expensive bundles.
- Google Maps preview remains isolated in discovery components.

Remaining risks:

- Many feature components are client components, especially discovery, task center, cadence forms, billing panels, import job detail, admin inline actions, and PWA/offline helpers.
- Several modals mount inside feature components instead of being lazily loaded on interaction.
- Admin pages are mostly server-rendered pages with small client islands, but table/filter duplication creates long-term maintenance cost.

## Phase 2 Priority Order

1. `/app/leads/[leadId]`: unify detail layout, mobile actions, notes/tasks/cadence panels, and empty/error states.
2. `/app/pipeline`: improve mobile horizontal board affordance and reusable pipeline cards.
3. `/app/cadences`: convert forms/actions/modals to new primitives.
4. `/app/analytics`: keep charts isolated, improve mobile tables and summary cards.
5. `/app/billing` and `/app/settings`: standardize plan/payment forms, confirmation dialogs, and account panels.
6. `/admin/*`: introduce admin table/filter/action primitives and responsive card fallback for narrow screens.

## Business Logic Risk Map

Do not alter without a dedicated logic task:

- Auth/session checks in app/admin layouts.
- `requireAdmin`, admin permission checks, audit/security event behavior.
- Supabase RLS assumptions and table schemas.
- Google Maps provider payloads, quota/error handling, and demo-map config.
- Billing payment/subscription/webhook reconciliation.
- Lead/task/cadence payload contracts and status values.
- PWA offline queue and local cache ownership boundaries.

## Acceptance Checklist

- Design tokens centralized and available through CSS variables/Tailwind aliases.
- Reusable primitive set established for forms, buttons, overlays, navigation, status, and loading.
- User shell and admin shell remain separate.
- Mobile app navigation supports a real bottom-sheet More menu.
- No feature route/API/database/business logic changes were introduced in this phase.
- Remaining page-level redesign work is documented and sequenced for Phase 2.
