# Public Beta Deployment Checklist

Date: 2026-08-04
Target domain: `https://salemap.io.vn`
Status: **Not deployed by this gate**

## Decision

Deployment readiness: **FAIL until manual evidence is added**

Local build and smoke pass, but deployment readiness requires production/staging env verification, migration proof, backup/restore proof, monitoring proof, and owner approval.

## Local Build Evidence

| Check | Result |
| --- | --- |
| `npm ci --cache .npm-cache` | Passed. |
| `npm audit --cache .npm-cache --audit-level=moderate` | Passed with 0 vulnerabilities after lockfile update. |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run security:scan` | Passed. |
| `npm run test` | Passed; runs release regression plus mobile gate. |
| `npm run test:e2e` | Passed; runs local HTTP smoke, not authenticated browser E2E. |
| `npm run test:phase2e2` | Passed. |
| `npm run test:mobile` | Passed. |
| `npm run build` | Passed. |
| `npm run smoke` | Passed 47/47 local checks. |
| `npm run smoke:staging -- https://salemap.io.vn` | Passed public routes, protected/admin redirects, security headers, and PWA manifest. |

## Deployment Checklist

- [ ] Confirm hosting project for `salemap.io.vn`.
- [ ] Confirm latest commit to deploy: `bf8fd05e2b819d243ba4e77305c2eca42b57a8df` or later approved release commit.
- [ ] Confirm production env variables without exposing values.
- [ ] Confirm `NEXT_PUBLIC_SITE_URL=https://salemap.io.vn`.
- [ ] Confirm Supabase URL/key point to intended production project.
- [ ] Confirm all Supabase migrations in `PUBLIC_BETA_MIGRATION_PLAN.md` have been applied.
- [ ] Confirm backup snapshot exists before deploy.
- [ ] Confirm rollback plan owner and deploy rollback command.
- [ ] Confirm Sentry/log alert routing.
- [ ] Confirm payment is disabled unless payment checklist passes.
- [ ] Confirm beta access is invite-only or capped.
- [x] Run unauthenticated smoke against deployed domain `https://salemap.io.vn`.
- [ ] Run authenticated staging/browser QA against deployed URL.
- [ ] Run authenticated QA with beta test accounts.
- [ ] Get manual approval from product/security/data/payment owners.

## Config Observations

- `next.config.mjs` sets CSP, security headers, image restrictions, `poweredByHeader=false`, and Turbopack root.
- No `vercel.json` was found.
- No `.nvmrc` was found.
- `.env.local` is ignored by git.
- Service worker skips `/api`, `/admin`, auth, onboarding, and billing routes.

## Stop Condition

Do not deploy production from this gate.
