# Public Beta Backup Plan

Date: 2026-08-04
Release status: **Blocker**

## Decision

Backup readiness: **FAIL**

No verified staging or production backup artifact, point-in-time recovery configuration, restore drill, backup owner, RPO, or RTO evidence was found during this gate.

## Minimum Required Before Public Beta

| Requirement | Status | Required evidence |
| --- | --- | --- |
| Production database backup exists | Not verified | Backup id/snapshot timestamp from Supabase. |
| Restore drill completed | Not verified | Restore log and validation checklist. |
| Backup owner assigned | Not verified | Named owner and escalation contact. |
| RPO defined | Not verified | Accepted data-loss window. |
| RTO defined | Not verified | Accepted recovery time. |
| Pre-migration backup taken | Not verified | Backup id before SQL release. |
| Export of critical operational tables | Not verified | Optional CSV/object export location. |

## Data Classes To Protect

- Auth users and profiles.
- Leads, notes, tasks, reminders, cadences, imports/exports.
- Payment requests, billing payments, subscriptions, entitlements, orders.
- Admin users, permissions, audit logs, security events.
- Support tickets and ticket messages.
- CMS posts/pages/redirects and SEO metadata.
- Feature flags, beta invites, quotas, provider settings.

## Restore Drill Procedure

1. Create a staging backup snapshot.
2. Restore into a non-production Supabase project or isolated staging database.
3. Run smoke checks against the restored environment.
4. Verify at least one user-owned workflow and one admin read-only workflow.
5. Verify RLS blocks cross-user reads.
6. Record restore duration, errors, and manual steps.
7. Sign off before production launch.

## Public Beta Gate Requirement

Public Beta remains blocked until backup existence and restore strategy are proven.
