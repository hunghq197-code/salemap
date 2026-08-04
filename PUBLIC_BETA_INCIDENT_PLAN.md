# Public Beta Incident Plan

Date: 2026-08-04
Status: **Draft; owner approval required**

## Incident Severity

| Severity | Examples | Immediate action |
| --- | --- | --- |
| SEV1 | Data leak, cross-user access, payment double activation/charge, auth outage, destructive data loss | Disable affected feature, stop beta invites, notify owners, preserve logs. |
| SEV2 | Multiple users blocked from core workflow, major admin/payment/support failure | Disable or rollback affected release, assign hotfix owner. |
| SEV3 | Single-user bug, non-critical workflow issue | Triage through support ticket and backlog. |
| SEV4 | Feedback/copy/polish | Product review batch. |

## First 30 Minutes

1. Declare severity and owner.
2. Preserve logs, request ids, user ids, payment ids, and timestamps.
3. Disable risky feature flag/provider if data, payment, or auth is involved.
4. For payment incidents, set billing/payment disabled flags immediately.
5. For security incidents, revoke suspected leaked keys and rotate secrets.
6. Decide rollback vs hotfix.
7. Post user-facing notice if users are affected.

## Escalation Owners To Assign

- Incident commander.
- Engineering owner.
- Security owner.
- Data/Supabase owner.
- Payment owner.
- Support owner.
- Communications/product owner.

## Required Before Beta

- [ ] Define owner names and contact channels.
- [ ] Confirm monitoring alert destination.
- [ ] Confirm rollback authority.
- [ ] Confirm Supabase backup/restore owner.
- [ ] Confirm payment provider emergency disable path.
- [ ] Confirm user communication template.
