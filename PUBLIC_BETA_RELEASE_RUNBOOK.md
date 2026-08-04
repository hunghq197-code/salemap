# Public Beta Release Runbook

Date: 2026-08-04
Status: **Draft; not executed**

## Gate Rule

Do not release Public Beta unless `PUBLIC_BETA_RELEASE_REPORT.md` changes from `FAIL` to `PASS` or `PASS WITH CONTROLLED LIMITATIONS` after blockers and critical issues are closed.

## Pre-Release

1. Confirm release commit.
2. Confirm git status clean.
3. Run `npm ci`.
4. Run `npm run lint`.
5. Run `npm run typecheck`.
6. Run `npm run security:scan`.
7. Run `npm run test`.
8. Run `npm run test:e2e` and remember this repo's current script is local HTTP smoke, not authenticated browser E2E.
9. Run available regression suites such as `npm run test:phase2e2`.
10. Run `npm run build`.
11. Run local `npm run smoke`.
12. Run `npm audit --cache .npm-cache --audit-level=moderate`.
13. Verify env checklist.
14. Verify migration checklist.
15. Verify backup and restore drill.
16. Verify browser/mobile matrix.
17. Verify payment disabled state or payment checklist pass.
18. Verify monitoring and incident owner.
19. Get manual owner approvals.

## Staging Release

1. Deploy approved commit to staging.
2. Apply migrations to staging only after backup.
3. Run staging smoke against staging URL.
4. Run authenticated QA accounts:
   - normal user
   - support
   - admin
   - super admin
5. Run payment sandbox tests only if payment is intentionally enabled in staging.
6. Run mobile/desktop browser matrix.
7. Fix or document limitations.

## Production Release

This gate did not execute production release. When approved:

1. Confirm final release decision and approvals.
2. Take production backup.
3. Deploy approved version.
4. Apply production migrations only if approved.
5. Keep beta access capped.
6. Keep payments disabled unless payment gate passes.
7. Run production smoke.
8. Monitor logs, Sentry, analytics, support tickets, and payment queues.

## Post-Release

- Watch first 24 hours closely.
- Triage support tickets daily.
- Review failed jobs/imports/payments/security events.
- Decide whether to widen beta cohort only after stable metrics.
