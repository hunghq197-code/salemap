# UI Phase 2D Billing Report

## 1. Phạm vi hoàn thành

Phase 2D tập trung vào Billing UI, Payment Production QA, Subscription & Quota Operations cho SaleMap:

- Redesign `/app/billing`, `/app/billing/checkout`, `/app/billing/success`, `/app/billing/cancel`.
- Bổ sung admin detail pages: `/admin/payments/[paymentId]`, `/admin/subscriptions/[subscriptionId]`.
- Cập nhật `/admin/payments`, `/admin/subscriptions`, Billing section trong `/admin/users/[userId]`.
- Siết billing core: payment transition guard, idempotent paid processing, amount/plan/currency validation, audit log rõ action.
- Cập nhật security scan và migration idempotency indexes.

## 2. Billing architecture hiện tại

- Plan source-of-truth: `lib/billing/plans.ts`.
- Payment orchestration: `lib/billing/payments.ts`.
- Subscription lifecycle mới: `lib/billing/subscriptions.ts`.
- Entitlement/quota: `lib/billing/entitlements.ts` và quota server-side qua `lib/data/subscriptions.ts`.
- Provider adapters:
  - `lib/billing/providers/manual-bank.ts`
  - `lib/billing/providers/payos.ts`

Client chỉ gửi `planId`, `billingPeriod`, `provider`. Amount, currency, entitlement và subscription activation đều do server quyết định.

## 3. Providers hỗ trợ

- `manual_bank_transfer`: tạo hướng dẫn chuyển khoản, user confirm chỉ chuyển payment sang `waiting_confirmation`.
- `vietqr_manual`: dùng cùng manual flow, hiển thị QR khi backend trả `qrCode`.
- `payos`: tạo checkout URL khi enabled/configured; return page không activate, webhook/reconciliation mới xử lý paid.

payOS không hiển thị trong selector nếu server chưa bật provider.

## 4. Plan & pricing

Plan source-of-truth nằm tại `lib/billing/plans.ts`:

- Free: 0đ/tháng.
- Pro: 149.000đ/tháng.
- Pro Plus: 399.000đ/tháng.

Đã thêm `formatPlanPrice()` để UI/server có helper format chung. Free không có CTA mua. Current paid plan có thể tạo payment gia hạn qua billing provider mới.

## 5. User billing UI

Files/component chính:

- `components/billing/CurrentPlanCard.tsx`
- `components/billing/BillingUsageSummary.tsx`
- `components/billing/QuotaUsageItem.tsx`
- `components/billing/PricingPlanGrid.tsx`
- `components/billing/PricingPlanCard.tsx`
- `components/billing/PaymentMethodSelector.tsx`
- `components/billing/PaymentHistory.tsx`
- `components/billing/PaymentHistoryItem.tsx`
- `components/billing/PaymentStatusBadge.tsx`
- `components/billing/ManualTransferInstructions.tsx`

`/app/billing` hiện có:

- Current plan/status.
- Usage & quota theo server-side quota snapshot.
- Payment methods.
- Payment history mới từ `payments`.
- Pricing grid theo `lib/billing/plans.ts`.
- FAQ giải thích return/cancel/manual/payOS không tự activate sai.

## 6. Checkout, success, cancel behavior

- `/app/billing/checkout`: hiển thị payment summary, manual/VietQR instructions, QR responsive, copy buttons, payOS checkout URL nếu có.
- Manual/VietQR CTA `Tôi đã chuyển khoản` chỉ gọi confirm-transfer và đưa payment về `waiting_confirmation`.
- `/app/billing/success`: chỉ đọc payment status theo user ownership; không gọi mutation.
- `/app/billing/cancel`: chỉ đọc trạng thái; không tạo payment mới và không mutate subscription.

## 7. Payment core QA

Đã cập nhật `lib/billing/payments.ts`:

- Thêm `isValidPaymentTransition(from, to)`.
- Giới hạn mutable statuses: `pending`, `processing`, `waiting_confirmation`.
- `processPaymentPaid()` early-return khi payment đã paid và subscription event đã xử lý.
- Server validate plan paid, amount expected và currency `VND` trước paid processing.
- Amount/plan/currency mismatch tạo payment event và security event.
- Mark failed/cancel không còn đổi trạng thái từ paid/final.
- Admin audit actions rõ hơn:
  - `manual_payment_approved`
  - `payment_marked_failed`
  - `payment_cancelled`

## 8. Idempotency

- Runtime:
  - `isPaymentAlreadyProcessed()` kiểm tra `subscription_events.payment_id`.
  - Paid payment lặp không extend subscription thêm.
  - Duplicate webhook/reconciliation/admin action trả về idempotent hoặc bị chặn theo status transition.
- Database migration:
  - Unique `order_code` đã có.
  - Thêm unique index cho `payment_code` khi không null.
  - Thêm unique index cho `payment_link_id` khi không null.
  - Thêm partial unique index cho paid subscription events theo `payment_id`.

## 9. Subscription lifecycle

Đã cập nhật admin actions/API sang billing core mới:

- Extend: `extendSubscription()`.
- Change plan/downgrade: `changePlan()`.
- Cancel: `cancelSubscription()`.
- Grant trial: `grantTrial()`.

Audit log action rõ hơn:

- `subscription_extended`
- `subscription_plan_changed`
- `subscription_cancelled`
- `subscription_trial_granted`

Cron lifecycle hiện xử lý:

- Active/trialing hết hạn -> `grace`.
- Grace hết hạn -> `expired`.
- Expired/cancelled entitlement quay về Free qua `getSubscriptionStatus()`.

## 10. Quota/entitlement integration

Quota UI trên billing dùng server snapshot, không tính quota từ client. Entitlement path hiện tại:

- `getUserEntitlements(userId)`
- `getQuotaLimit(userId, action)`
- `checkQuota()`
- `consumeQuota()`
- `getDailyQuotaLimitForUser()`

Active/trialing/grace dùng plan entitlement. Expired/cancelled/free dùng Free entitlement. Quota override và feature override vẫn được áp dụng server-side.

## 11. Admin payment UI

Đã cập nhật:

- `/admin/payments`: thêm filters provider/status/plan/date/search, KPI summary, detail link, support read-only UI.
- `/admin/payments/[paymentId]`: payment summary, user summary, transfer details, linked subscription, admin actions, payment event timeline.
- `components/admin/billing/PaymentEventTimeline.tsx`: chỉ hiển thị `safe_event`, không render raw event.

Admin mark paid chỉ hiện khi role có `UPDATE_PAYMENT_STATUS`, và server vẫn enforce permission.

## 12. Admin subscription UI

Đã cập nhật:

- `/admin/subscriptions`: thêm detail link.
- `/admin/subscriptions/[subscriptionId]`: subscription summary, entitlements, linked payments, subscription event timeline, admin actions.
- `components/admin/billing/SubscriptionEventTimeline.tsx`: hiển thị metadata đã lọc key nhạy cảm.

Billing section trong `/admin/users/[userId]` bổ sung:

- Billing payment count.
- Link subscription detail.
- Recent provider payments.
- Recent subscription events.

## 13. Security updates

- `scripts/security-scan.mjs` bổ sung rule payment core phải có transition/idempotency guard.
- User/admin payment detail không render `provider_payload`, `raw_event`, webhook signature, checksum, secret.
- Admin APIs vẫn đi qua `handleAdminApi()` với same-origin, permission và rate-limit.
- Cron vẫn dùng `CRON_SECRET`.
- Client components không import server-only billing modules.

## 14. Files created

- `UI_PHASE_2D_BILLING_REPORT.md`
- `app/admin/payments/[paymentId]/page.tsx`
- `app/admin/subscriptions/[subscriptionId]/page.tsx`
- `components/admin/billing/PaymentEventTimeline.tsx`
- `components/admin/billing/SubscriptionEventTimeline.tsx`
- `components/billing/BillingUsageSummary.tsx`
- `components/billing/CurrentPlanCard.tsx`
- `components/billing/ManualTransferInstructions.tsx`
- `components/billing/PaymentHistory.tsx`
- `components/billing/PaymentHistoryItem.tsx`
- `components/billing/PaymentMethodSelector.tsx`
- `components/billing/PaymentStatusBadge.tsx`
- `components/billing/PricingPlanCard.tsx`
- `components/billing/PricingPlanGrid.tsx`
- `components/billing/QuotaUsageItem.tsx`

## 15. Files updated

- `app/app/billing/page.tsx`
- `app/app/billing/success/page.tsx`
- `app/app/billing/cancel/page.tsx`
- `components/billing/BillingCheckoutPanel.tsx`
- `components/billing/BillingPlans.tsx`
- `app/admin/payments/page.tsx`
- `app/admin/subscriptions/page.tsx`
- `app/admin/subscriptions/actions.ts`
- `app/admin/users/[userId]/page.tsx`
- `app/api/admin/subscriptions/[subscriptionId]/extend/route.ts`
- `app/api/admin/subscriptions/[subscriptionId]/change-plan/route.ts`
- `app/api/admin/subscriptions/[subscriptionId]/cancel/route.ts`
- `lib/admin/data/billing-payments.ts`
- `lib/admin/data/subscriptions.ts`
- `lib/admin/data/users.ts`
- `lib/billing/billing-errors.ts`
- `lib/billing/payments.ts`
- `lib/billing/plans.ts`
- `lib/billing/subscriptions.ts`
- `lib/data/subscriptions.ts`
- `lib/design-system/status.ts`
- `scripts/security-scan.mjs`
- `supabase/billing-provider-architecture.sql`

## 16. Validation

Đã chạy trong phiên này:

- `npm run typecheck`: pass.
- `npm run lint`: pass, 0 warnings.
- `npm run security:scan`: pass.
- `npm run build`: pass.
- `npm run smoke`: pass, 39/39 checks.

## 17. Env variables cần cấu hình

- `BILLING_ENABLED=true`
- `BILLING_ALLOWED_PROVIDERS=manual_bank_transfer,vietqr_manual,payos` tùy môi trường.
- `BILLING_DEFAULT_PROVIDER=manual_bank_transfer`
- `BILLING_BANK_NAME`
- `BILLING_BANK_ACCOUNT_NUMBER`
- `BILLING_BANK_ACCOUNT_NAME`
- `BILLING_TRANSFER_PREFIX`
- `VIETQR_ENABLED`
- `VIETQR_BANK_BIN`
- `VIETQR_TEMPLATE`
- `PAYOS_ENABLED`
- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`
- `NEXT_PUBLIC_SITE_URL` hoặc app URL tương ứng.
- `CRON_SECRET`

## 18. Migration cần chạy

Chạy lại `supabase/billing-provider-architecture.sql` trên Supabase để có:

- `payments`
- `payment_events`
- `subscription_events` mở rộng
- unique indexes mới cho idempotency

Nếu môi trường đã có dữ liệu trùng `payment_code` hoặc `payment_link_id`, cần xử lý dữ liệu trùng trước khi tạo unique index.

## 19. Rủi ro production còn lại

- Chưa xác thực bằng giao dịch ngân hàng/payOS thật trong phiên local này.
- Cần test với PayOS sandbox/live credentials để xác nhận checksum/webhook từ provider thật.
- Cần test manual bank reconciliation bằng admin account thật.
- Cần chạy migration trên staging trước production.
- Visual screenshot QA có thể cần account authenticated và dữ liệu seed phù hợp.

## 20. Đề xuất phase tiếp theo

- Tạo authenticated Playwright suite cho Billing: Free -> create payment -> manual confirm -> admin mark paid -> quota update.
- Tạo mock payOS webhook integration test bằng payload fixture hợp lệ/không hợp lệ.
- Thêm admin correction/refund flow có phân quyền cao nếu production cần hoàn tiền.
