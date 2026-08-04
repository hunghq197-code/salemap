# Public Beta Access Plan

Date: 2026-08-04
Status: **Requires owner approval**

## Decision

Access readiness: **Not ready until invite/cap controls are verified**

Public Beta must be controlled. Do not open registration broadly until auth, user isolation, payment disabled state, support, monitoring, and backup gates pass.

## Recommended Beta Limits

| Control | Recommendation |
| --- | --- |
| Access mode | Invite-only. |
| Initial cohort | 10 to 30 users. |
| Account approval | Manual approval or invite code validation. |
| Payment | Disabled unless payment gate passes. |
| AI | Cost-capped or disabled. |
| Data import | Limit file size and monitor failures. |
| Support | Single support channel with response owner. |
| Feedback | In-app feedback plus support tickets. |

## Required Controls

- [ ] Confirm `NEXT_PUBLIC_BETA_INVITE_ONLY` behavior in production.
- [ ] Confirm beta invite validation API works in staging.
- [ ] Confirm registration can be stopped quickly.
- [ ] Confirm admin can suspend/reactivate users.
- [ ] Confirm user quota and feature override controls work.
- [ ] Confirm feedback/support channel owners.
- [ ] Publish beta notice and limitations.
- [ ] Confirm terms/privacy readiness.

## Stop Switches

- Disable registration or invite issuance.
- Disable billing/payment flags.
- Disable AI provider or set cost cap low.
- Disable map demo mode in production.
- Use feature flags to hide risky modules.
- Revert deploy if authentication, data isolation, or payment safety fails.
