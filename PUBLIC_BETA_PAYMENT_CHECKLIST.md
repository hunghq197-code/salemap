# Public Beta Payment Checklist

Date: 2026-08-04
Payment release status: **FAIL / keep disabled**

## Decision

Production payment must not be enabled for Public Beta until this checklist passes. The code has payment architecture for manual bank transfer, VietQR-style manual flow, and payOS, but no live/sandbox payment run, webhook replay, reconciliation, refund/cancel path, or bank settlement evidence was verified.

## Current Local Env Status

| Payment area | Local key status | Runtime implication |
| --- | --- | --- |
| `BILLING_ENABLED` | Missing | Billing is disabled by server code unless set to `true`. |
| `NEXT_PUBLIC_BILLING_ENABLED` | Missing | Public billing UI flag not explicitly enabled. |
| `BILLING_ALLOWED_PROVIDERS` | Missing | Defaults to manual bank transfer only in server logic. |
| `BILLING_DEFAULT_PROVIDER` | Missing | Defaults to manual bank transfer. |
| Bank billing envs | Missing | Manual bank transfer cannot be advertised safely. |
| payOS credentials | Present | Credentials exist, but `PAYOS_ENABLED` is missing. |
| `PAYOS_ENABLED` | Missing | payOS provider remains disabled. |
| VietQR envs | Missing | VietQR cannot be advertised safely. |

## Required payOS Checks

- [ ] Configure payOS dashboard webhook URL: `https://salemap.io.vn/api/webhooks/payos`.
- [ ] Use HTTPS only.
- [ ] Verify webhook signature with a valid payOS event.
- [ ] Verify invalid signature is rejected.
- [ ] Verify webhook replay/idempotency does not double-activate payment/subscription.
- [ ] Verify return page does not activate payment without webhook/reconciliation.
- [ ] Verify cancel flow does not mark paid.
- [ ] Verify admin sync/reconciliation behavior.
- [ ] Verify amount/order code/source-of-truth comes from server records only.
- [ ] Verify rate limiting on webhook endpoint.
- [ ] Verify no raw webhook payload is rendered in admin UI.

## Required VietQR / Manual Transfer Checks

- [ ] Confirm bank name, account number, account name, branch, and transfer prefix.
- [ ] Confirm QR content cannot be edited by client to change amount/order owner.
- [ ] Confirm user cannot self-activate subscription from upload/reference alone.
- [ ] Confirm admin approval records audit log and bounded reason/status.
- [ ] Confirm duplicate transfer reference is idempotent.
- [ ] Confirm failed/rejected transfer does not grant entitlement.

## Safe Beta Posture

Recommended Public Beta posture until this checklist passes:

- `BILLING_ENABLED=false`
- `NEXT_PUBLIC_BILLING_ENABLED=false`
- `PAYOS_ENABLED=false`
- `VIETQR_ENABLED=false`
- Do not advertise paid checkout.
- Use manual admin-managed beta access or trial grants only after owner approval.
