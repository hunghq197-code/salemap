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
- Chạy `npm run build`.
- Commit và push sau mỗi giai đoạn.
