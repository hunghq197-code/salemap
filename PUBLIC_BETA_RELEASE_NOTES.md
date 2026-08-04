# Public Beta Release Notes

Date: 2026-08-04
Status: **Draft only; do not publish until release gate passes**

## Internal Release Note

SaleMap has a broad beta-ready application surface in source: public site, auth pages, dashboard, lead workflows, tasks, pipeline, cadences, import/export, map discovery, analytics, billing foundations, support tickets, admin operations, and CMS. Local quality gates pass: lint, typecheck, security scan, Phase 2E2 regression, production build, and local smoke.

Public Beta is not approved yet because backup/restore, migration evidence, authenticated browser E2E, production monitoring, payment readiness, and manual approvals are incomplete.

## User-Facing Draft

SaleMap Public Beta gives selected users access to:

- Lead and customer workflow management.
- Map-based discovery and lead saving.
- Follow-up tasks and pipeline tracking.
- Import/export helpers.
- Sales analytics.
- Support ticket submission.

## Beta Limitations

- Access is limited and may require invite approval.
- Some features may be disabled while we validate reliability and safety.
- Payment and paid checkout are not enabled unless separately announced.
- AI usage may be capped or disabled.
- Data import/export limits may apply.
- Support response targets are beta-level, not enterprise SLA.

## Do Not Publish Until

- Public Beta release decision is no longer `FAIL`.
- Backup and restore drill are verified.
- Mobile/browser matrix passes.
- Authenticated user isolation and admin role tests pass.
- Payment remains disabled or payment checklist passes.
- Product/security/data/payment/support owners approve.
