# SaleMap Security Checklist

## Auth And Roles

- Admin route `/admin/*` dùng server-side `requireAdmin`.
- Admin API `/api/admin/*` dùng `handleAdminApi` + permission cụ thể.
- Role nguồn chính là `admin_users`: `super_admin`, `admin`, `support`.

## Secrets

- Không dùng `SUPABASE_SERVICE_ROLE_KEY` trong client component.
- Không đưa `GOOGLE_MAPS_API_KEY`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `AI_API_KEY` vào `NEXT_PUBLIC_*`.
- `/admin/system` chỉ hiển thị present/missing, không hiển thị secret value.

## Data Privacy

- Admin user detail chỉ hiển thị count/status/summary.
- Không render note content, phone, address hoặc raw Google Maps payload mặc định.
- Audit/security metadata đi qua sanitizer trước khi lưu/hiển thị.
- Analytics tools chỉ nhận sanitized events/page paths; không gửi lead names, phone/Zalo, email, note content, raw Google Maps payload, hoặc query parameters nhạy cảm.

## Payment

- payOS webhook phải verify checksum/signature.
- Webhook sai signature ghi `security_events.invalid_payment_webhook`.
- Transaction paid xử lý idempotent, không gia hạn nhiều lần nếu callback lặp lại.

## Quota And Abuse

- Quota enforce server-side qua `getDailyQuotaLimitForUser`.
- User quota override đọc từ `user_quota_overrides`.
- Feature override đọc từ `user_feature_overrides`.
- Rate limit admin API và webhook payment.

## Import Export

- Import route giới hạn rate, file type/flow mapping hiện có.
- Export route dùng auth hiện tại và chỉ export dữ liệu user hiện tại.

## Operations

- Chạy `npm run lint`.
- Chạy `npm run typecheck`.
- Chạy `npm run security:scan`.
- Chạy `npm run test:phase2e2` sau khi chạm CRM/orders/tickets/CMS.
- Chạy `npm run build`.
- Commit và push sau mỗi giai đoạn.

## Admin Operations Phase 2E2

- Support role is read-only by default in server permissions. It must not include payment, subscription, user-status, quota, security-resolve, CRM-write, ticket-write, catalog/order/CMS-write, admin-user, or system-settings permissions.
- Admin UI may hide buttons, but every sensitive operation must still use server-side `requirePermission` or `handleAdminApi`.
- Sensitive admin submit buttons should use confirmation UI.
- User suspension requires a bounded reason, blocks self-suspension, blocks the last active super admin, writes an audit log, and writes `admin_user_suspended`.
- Admin security events use separate read and resolve permissions.
- Admin UI must not render raw provider payload, auth metadata, tokens, password hashes, or service metadata.
- Apply updated support read-only RLS policies from `supabase/admin-security.sql`, `supabase/admin-customer-crm.sql`, and `supabase/support-tickets.sql`.
- Run `npm run test:phase2e2` and `npm run security:scan` after admin operation changes.
