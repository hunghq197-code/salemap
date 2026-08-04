# SaleMap Public Beta Release Report

Date: 2026-08-04
Branch: `main`
Commit reviewed: `bf8fd05e2b819d243ba4e77305c2eca42b57a8df` (`feat: complete admin operations center`)
Domain target: `https://salemap.io.vn`
Scope: source, config templates, local dependency install, static checks, mobile source gate, production build, local smoke. No production deploy, no production migration, no production data mutation.

## Release Decision

Decision: **FAIL**

SaleMap is not ready for Public Beta today. The source builds and passes local static/smoke/mobile gates, but the release acceptance criteria require verified backup/restore, production/staging migration evidence, authenticated user isolation E2E, payment safety evidence, monitoring evidence, and manual owner approval evidence. Those are incomplete or unverified.

## Evidence Collected

| Gate | Result | Notes |
| --- | --- | --- |
| Git status | Pass at start | Base was `main...origin/main`; release-gate docs/scripts are now uncommitted local changes. |
| `npm ci` | Pass | Run with workspace cache: `npm ci --cache .npm-cache`. |
| Dependency audit | Pass | `npm audit --cache .npm-cache --audit-level=moderate` reported `found 0 vulnerabilities`. |
| `npm run lint` | Pass | ESLint completed with exit code 0. |
| `npm run typecheck` | Pass | `tsc --noEmit` completed with exit code 0. |
| `npm run security:scan` | Pass | Internal security scan completed with `SECURITY SCAN PASS`. |
| `npm run test` | Pass | Runs `npm run test:release`, which runs Phase 2E2 regression plus mobile release gate. |
| `npm run test:e2e` | Pass | Runs local HTTP smoke via `npm run smoke`; this is not authenticated browser E2E. |
| `npm run test:phase2e2` | Pass | Phase 2E2 regression completed with `PHASE 2E2 REGRESSION PASS`. |
| `npm run test:mobile` | Pass | Mobile source gate completed with `MOBILE RELEASE GATE PASS`. |
| `npm run build` | Pass | Next.js production build completed; 102 static pages generated. |
| `npm run smoke` | Pass | Local smoke completed 47/47 checks. |

## Blockers

1. Backup existence and restore drill are not verified for staging or production.
2. Authenticated staging/production user isolation E2E was not run for normal user, support, admin, and super admin.

## Critical

1. Production/staging migration status is unverified. SQL order exists, but there is no proof all required migrations were applied to the real Supabase project.
2. Latest RLS tightening for support read-only behavior must be applied or rerun before relying on admin/support permissions.
3. Payment production readiness is unverified. payOS credentials exist locally, but `PAYOS_ENABLED`, `BILLING_ENABLED`, and VietQR envs are not fully configured locally and no live/sandbox webhook test evidence exists.
4. Monitoring readiness is unverified. Sentry/PostHog/Clarity keys are present locally, but alert routing, ownership, and production event capture were not verified.
5. Production env must prove payment is disabled or `PUBLIC_BETA_PAYMENT_CHECKLIST.md` must pass before launch.

## Major

1. Staging smoke was not run against `https://salemap.io.vn`.
2. Mobile source gate passes, but real iOS/Android visual/browser matrix is not complete.
3. Desktop visual/browser matrix is not complete.
4. No restore runbook execution record or database point-in-time recovery evidence was found.
5. No explicit `.nvmrc`, `vercel.json`, or production runtime pin was found.
6. Admin aggregate helpers may need pagination/scale work before large production usage.

## Minor

1. `template_categories` has an intentional public read policy with `using (true)`; this should be re-reviewed before production data is added.
2. Local `.env.local` is missing Google Analytics and Google Search Console public env keys used by the app.
3. Release owner approvals are not recorded.

## Disabled Or Limited Features For Beta

| Feature | Required beta setting |
| --- | --- |
| Open registration | Keep disabled or invite-only until access plan is approved. |
| Production billing | Keep disabled until payment checklist passes. |
| payOS | Keep disabled until webhook, return/cancel, reconciliation, and idempotency are tested end to end. |
| VietQR | Keep disabled or manual-only until bank/VietQR env and manual reconciliation are verified. |
| AI assistant | Keep cost-limited and monitored; disable if provider/cost alerting is not verified. |
| CMS media upload | Treat as metadata/public URL only until storage policies are verified. |
| Automatic add-on commerce | Do not enable until add-on order payment bridge is implemented and tested. |

## Provider Status

| Provider | Local key status | Release status |
| --- | --- | --- |
| Supabase | Required keys present locally | Needs migration/RLS/auth evidence. |
| Google Maps | Server/browser keys present locally | Needs staging smoke with real quota and domain restrictions. |
| AI provider | Keys/cost env present locally | Needs beta monitoring and cost owner approval. |
| Resend email | Key/from env present locally | Needs production sender/domain verification evidence. |
| Sentry | Server/public DSN present locally | Needs alert/project verification. |
| PostHog/Clarity | Public env present locally | Needs privacy/consent review for beta. |
| Google Analytics | Local `NEXT_PUBLIC_GA_MEASUREMENT_ID` missing | Configure before analytics launch. |
| Google Search Console | Local verification env missing | Configure before ownership verification. |
| payOS | Credentials present, enable flag missing | Must remain disabled until payment checklist passes. |
| VietQR | Required local env missing | Must remain disabled/not advertised. |

## Required Output Summary

| Required field | Current release answer |
| --- | --- |
| Release decision | `FAIL` |
| Blocker | Backup/restore missing; authenticated staging/production user isolation E2E missing. |
| Critical | Migration/RLS not verified; payment readiness unverified; monitoring unverified; production payment-disabled evidence missing. |
| Major | Staging URL smoke not run; mobile/desktop browser matrix incomplete; admin scale risks; no runtime pin files found. |
| Minor | Public template category policy needs review; analytics/search env missing locally; approvals not recorded. |
| Feature disabled | Billing/payOS/VietQR, open registration, automatic add-on commerce, CMS upload storage, AI unless controlled. |
| Provider enabled | Supabase, Google Maps, AI, Resend, Sentry, PostHog, Clarity appear configured locally by key presence only. |
| Provider disabled | Billing/payOS/VietQR must stay disabled for beta until checklist passes; GA/Search Console missing locally. |
| Migration needed | SQL order 1-31 from `PUBLIC_BETA_MIGRATION_PLAN.md`; latest RLS files must be applied/rerun. |
| Env missing | Billing envs, VietQR envs, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `PAYOS_ENABLED`. |
| Backup status | Not verified; blocker. |
| Restore drill status | Not run; blocker. |
| Monitoring status | Keys present locally for Sentry/PostHog/Clarity, but production project/alerts not verified. |
| Security status | Internal scan and npm audit pass; release security still incomplete until RLS/authenticated E2E/monitoring are verified. |
| Mobile status | Mobile source gate pass with controlled limitations; real device/browser QA still required. |
| Desktop status | Build/smoke pass locally; desktop browser matrix not verified. |
| Billing status | Disabled locally by missing `BILLING_ENABLED`; production readiness fail. |
| Admin status | Source/regression pass; authenticated role QA and migration proof missing. |
| Test status | Lint/typecheck/security/regression/mobile/build/smoke pass locally; authenticated browser E2E missing. |
| Build status | Production build pass. |
| Known limitations | Payment production disabled, CMS media metadata-only, add-on payment bridge deferred, no authenticated browser E2E, no load/browser matrix. |
| Production risks | Data isolation, migrations, backup/restore, payment safety, monitoring, mobile UX. |
| Manual approvals needed | Product, security, data/DB, payment, support, legal/privacy, DevOps. |

## Required Manual Approvals

- Product owner: beta scope, disabled features, invite limit, release notes.
- Security owner: dependency vulnerability disposition, RLS evidence, secret review.
- Data owner: backup, restore drill, retention, migration approval.
- Payment owner: payOS/VietQR disabled state or sandbox/live readiness.
- Support owner: support channel, incident workflow, response ownership.
- Legal/privacy owner: privacy/terms and analytics consent readiness.

## Final Gate

Public Beta must not launch until the blockers and critical items above are closed and rechecked.
