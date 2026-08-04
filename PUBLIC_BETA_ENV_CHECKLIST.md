# Public Beta Environment Checklist

Date: 2026-08-04
Source inspected: `.env.example`; local `.env.local` key names only, no secret values printed or copied.

## Summary

Decision: **FAIL for Public Beta**

Local env has many core keys, but production/staging env values, domain bindings, provider dashboards, and alert destinations were not verified. Several billing, VietQR, Google Analytics, and Search Console keys are missing locally.

## Required Core Env

| Env | Local key status | Beta status | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Present | Needs verification | Should match `https://salemap.io.vn` in production. |
| `NEXT_PUBLIC_APP_ENV` | Present | Needs verification | Must identify production/staging correctly. |
| `NEXT_PUBLIC_AUTH_REDIRECT_URL` | Present | Needs verification | Must match production auth callback/domain. |
| `NEXT_PUBLIC_SUPABASE_URL` | Present | Needs verification | Must point to intended Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present | Needs verification | Public key only. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Present | Needs verification | Public key only. |
| `SUPABASE_SERVICE_ROLE_KEY` | Present | Critical | Must exist only server-side and never in browser/client env. |
| `CRON_SECRET` | Present | Needs verification | Must be unique, high entropy, and installed in cron caller. |

## Provider Env

| Provider | Env | Local key status | Beta status |
| --- | --- | --- | --- |
| Google Maps | `GOOGLE_MAPS_API_KEY` | Present | Needs domain/quota/API restriction verification. |
| Google Maps | `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Present | Needs HTTP referrer restriction verification. |
| Demo maps | `ENABLE_DEMO_MAPS` | Present | Must be false in production. |
| AI | `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, `AI_DAILY_COST_LIMIT_VND` | Present | Needs monitoring/cost approval. |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` | Present | Needs sending-domain verification. |
| Analytics | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Present | Needs privacy approval. |
| Analytics | `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Present | Needs privacy approval. |
| Analytics | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Missing | Configure before GA launch. |
| Search Console | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Missing | Configure before site verification. |
| Error tracking | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Present | Needs alert/project verification. |

## Billing And Payment Env

| Env | Local key status | Required posture |
| --- | --- | --- |
| `NEXT_PUBLIC_BILLING_ENABLED` | Missing | Must be `false` until payment gate passes. |
| `BILLING_ENABLED` | Missing | Missing means billing is disabled by code. Keep disabled for beta gate. |
| `BILLING_DEFAULT_PROVIDER` | Missing | Defaults to manual only; configure only after approval. |
| `BILLING_ALLOWED_PROVIDERS` | Missing | Defaults to manual only; configure only after approval. |
| `BILLING_BANK_NAME` | Missing | Required before manual bank transfer is advertised. |
| `BILLING_BANK_ACCOUNT_NUMBER` | Missing | Required before manual bank transfer is advertised. |
| `BILLING_BANK_ACCOUNT_NAME` | Missing | Required before manual bank transfer is advertised. |
| `BILLING_BANK_BRANCH` | Missing | Optional but should be deliberate. |
| `BILLING_TRANSFER_PREFIX` | Missing | Required for reconciliation hygiene. |
| `BILLING_RETURN_PATH` | Missing | Required before payment provider links go live. |
| `BILLING_CANCEL_PATH` | Missing | Required before payment provider links go live. |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_PARTNER_CODE` | Present | Secrets present locally, but payOS remains disabled unless `PAYOS_ENABLED=true`. |
| `PAYOS_ENABLED` | Missing | Must stay disabled until webhook/payment checks pass. |
| `VIETQR_ENABLED` | Missing | Must stay disabled/not advertised until configured. |
| `VIETQR_BANK_BIN`, `VIETQR_ACCOUNT_NUMBER`, `VIETQR_ACCOUNT_NAME`, `VIETQR_TEMPLATE` | Missing | Required before VietQR is advertised. |
| `PAYMENT_PROVIDER`, `PAYMENT_BANK_*` | Present | Legacy/manual envs present; reconcile naming before release docs. |

## Required Before Re-Gate

1. Configure production env in hosting platform for `salemap.io.vn`.
2. Verify all secret envs are server-only.
3. Verify Google Maps key restrictions and enabled APIs.
4. Add GA/Search Console env values if analytics/search verification are launch requirements.
5. Keep billing/payment disabled unless `PUBLIC_BETA_PAYMENT_CHECKLIST.md` passes.
6. Record screenshots or exported provider settings as release evidence.
