# Public Beta Rollback Plan

Date: 2026-08-04
Status: **Plan exists, execution not tested**

## Decision

Rollback readiness: **Incomplete**

The application can likely be rolled back at the hosting/deploy level, but database rollback depends on verified backup/restore, which is currently a blocker. No production rollback drill was performed.

## Application Rollback

1. Identify last known good deployment/commit.
2. Disable risky feature/payment flags first if incident is scoped.
3. Roll back hosting deployment to the previous known-good version.
4. Run smoke against `https://salemap.io.vn`.
5. Verify auth and user dashboard.
6. Watch logs and support channel.

## Database Rollback

Default posture: fix-forward unless data owner approves restore.

1. Stop writes to affected workflow if possible.
2. Snapshot current state before any repair.
3. Assess impacted tables and users.
4. Apply narrow fix-forward SQL only after review.
5. Restore from backup only if approved and RTO/RPO impact is accepted.

## Payment Rollback

1. Set `BILLING_ENABLED=false`.
2. Set `NEXT_PUBLIC_BILLING_ENABLED=false`.
3. Set `PAYOS_ENABLED=false`.
4. Set `VIETQR_ENABLED=false`.
5. Disable public payment CTAs.
6. Reconcile any pending/paid records manually.
7. Contact payOS/bank support if live money moved incorrectly.

## Feature Rollback

- Use feature flags/user feature overrides where available.
- Disable AI if cost or safety incident occurs.
- Disable imports if data quality or load issue occurs.
- Disable map discovery if quota/cost issue occurs.
- Disable beta registration/invites if support load exceeds capacity.

## Required Before Re-Gate

- [ ] Confirm hosting rollback procedure and permissions.
- [ ] Confirm database backup/restore owner.
- [ ] Run at least one staging rollback drill.
- [ ] Record expected RTO and RPO.
