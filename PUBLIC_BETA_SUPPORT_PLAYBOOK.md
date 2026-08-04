# Public Beta Support Playbook

Date: 2026-08-04
Status: **Draft; owner approval required**

## Support Channels

| Channel | Purpose | Status |
| --- | --- | --- |
| In-app support tickets | User issues and operational follow-up | Implemented, needs staging role test. |
| In-app feedback | Product feedback and beta reports | Implemented, needs owner routing. |
| Email support | External backup channel | Needs verified sender/domain. |
| Admin dashboard | Triage, user/payment/ticket/security views | Implemented, needs authenticated QA. |

## Severity Levels

| Severity | Definition | Target response |
| --- | --- | --- |
| SEV1 | Auth outage, data leak, payment double-charge, destructive data issue | Immediate owner escalation; pause beta access. |
| SEV2 | Core workflow broken for multiple beta users | Same day triage; hotfix or feature disable. |
| SEV3 | Single-user issue or non-critical bug | Next business day triage. |
| SEV4 | Feedback, copy, UX polish | Batch into backlog. |

## Triage Flow

1. Confirm user, environment, browser/device, timestamp, and affected workflow.
2. Check admin alerts, audit logs, security events, support tickets, and payment state if relevant.
3. Classify severity.
4. For data/security/payment risk, stop the affected feature first.
5. Record action in admin notes/ticket.
6. Escalate to product/security/data/payment owner as needed.
7. Confirm resolution with user before closing.

## Required Before Beta

- [ ] Assign support owner and backup owner.
- [ ] Define public support email or form destination.
- [ ] Verify support role can view but not mutate protected admin data.
- [ ] Verify support ticket create/reply as normal user.
- [ ] Verify admin/support ticket response as staff.
- [ ] Prepare canned responses for billing disabled, beta limitations, and data deletion requests.
