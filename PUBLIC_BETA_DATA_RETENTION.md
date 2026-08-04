# Public Beta Data Retention

Date: 2026-08-04
Status: **Policy draft; legal/privacy approval required**

## Decision

Data retention readiness: **Not approved**

The codebase has privacy/terms pages and application data modules, but this gate did not verify legal approval, retention policy enforcement, deletion workflows, or production data export/delete procedures.

## Proposed Retention Defaults

| Data class | Proposed retention | Notes |
| --- | --- | --- |
| User profile/account | Account lifetime plus legal retention window | Deletion process must be defined. |
| Leads, notes, tasks, reminders | Account lifetime or user deletion request | User-owned data; RLS must be verified. |
| Imports/exports/jobs | 30 to 90 days for generated files/logs | Avoid retaining raw import error details longer than needed. |
| Payment/subscription/order records | Legal/accounting retention window | Do not delete without accounting/legal approval. |
| Support tickets/messages | 12 to 24 months | Respect privacy requests where allowed. |
| Admin audit/security logs | 12 to 24 months minimum | Needed for abuse/security investigations. |
| Analytics events | 6 to 13 months | Depends on analytics provider settings and privacy notice. |
| AI prompts/outputs | Minimize; user-visible history only if needed | Avoid storing sensitive content unless necessary. |
| CMS content | Until unpublished/deleted | Public publishing workflow. |

## Required Controls

- [ ] Publish beta privacy notice covering analytics, support, payments, maps, AI, and emails.
- [ ] Define user data export path.
- [ ] Define user deletion path.
- [ ] Define admin-only audit log retention.
- [ ] Define payment/legal retention exception.
- [ ] Verify provider-level retention in PostHog/Clarity/GA/Sentry.
- [ ] Verify Supabase backup retention and restore limits.

## Beta Notice Requirements

The beta notice should state:

- Product is in beta.
- Access may be limited or revoked.
- Some features may be disabled.
- Payment is disabled or manual unless explicitly approved.
- User can request support, export, or deletion through the support channel.
