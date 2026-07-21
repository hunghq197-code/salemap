# SaleMap Staging Post-Deploy Runbook

Runbook này dùng sau mỗi lần deploy staging trước khi gửi link cho người dùng test thật.

## 1. Cập Nhật Supabase Auth URL

Trong Supabase staging, vào **Authentication > URL Configuration**.

Set:

```text
Site URL = https://YOUR_STAGING_DOMAIN
```

Thêm redirect URLs:

```text
https://YOUR_STAGING_DOMAIN/**
http://localhost:3013/**
```

Nếu dùng domain riêng, thêm cả:

```text
https://YOUR_CUSTOM_DOMAIN/**
```

## 2. Kiểm Tra Env Trên Hosting

Tối thiểu phải có:

```env
NEXT_PUBLIC_SITE_URL=https://YOUR_STAGING_DOMAIN
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_AUTH_REDIRECT_URL=https://YOUR_STAGING_DOMAIN
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Staging an toàn ban đầu:

```env
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=false
NEXT_PUBLIC_ENABLE_PAYMENT_GATEWAY=false
NEXT_PUBLIC_ENABLE_IMPORT=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
```

Sau khi đổi env trên hosting, redeploy lại để env mới có hiệu lực.

## 3. Chạy Smoke Test Tự Động

PowerShell:

```powershell
$env:STAGING_URL="https://YOUR_STAGING_DOMAIN"
npm run smoke:staging
```

CMD:

```cmd
set STAGING_URL=https://YOUR_STAGING_DOMAIN
npm run smoke:staging
```

Hoặc truyền URL trực tiếp:

```bash
npm run smoke:staging -- https://YOUR_STAGING_DOMAIN
```

Kết quả đúng:

- Public routes trả `2xx` hoặc `3xx`.
- Protected routes khi chưa login redirect về `/login`, hoặc trả `401/403`.
- Manifest có đủ field PWA cơ bản.
- Security headers cơ bản tồn tại.

Nếu mọi route đều trả `302` về `vercel.com/sso-api`, staging đang bật Vercel Deployment Protection.

Cách xử lý:

- Nếu chuẩn bị gửi link cho tester bên ngoài, tắt Deployment Protection cho môi trường staging hoặc dùng domain/production deployment không bị SSO chặn.
- Nếu vẫn muốn giữ protection khi kiểm thử tự động, tạo Protection Bypass for Automation trong Vercel rồi set secret vào máy:

```powershell
$env:VERCEL_AUTOMATION_BYPASS_SECRET="YOUR_BYPASS_SECRET"
npm run smoke:staging -- https://YOUR_STAGING_DOMAIN
```

## 4. Tạo Admin Test Account

1. Đăng ký một tài khoản test trên staging.
2. Vào Supabase staging > Authentication > Users.
3. Copy user id.
4. Chạy SQL:

```sql
update public.user_profiles
set is_admin = true
where user_id = 'REPLACE_WITH_TEST_USER_ID';
```

5. Logout rồi login lại.
6. Mở `/admin`.

Không hardcode admin email trong source.

## 5. Test Bằng Tay Sau Smoke Test

Tối thiểu cần test:

- Register.
- Login/logout.
- Dashboard.
- Tạo lead.
- Thêm note.
- Tạo reminder.
- Import CSV nhỏ.
- Pipeline.
- Analytics.
- Admin dashboard.
- Mobile width khoảng 390px.
- PWA install page.

Chi tiết đầy đủ ở `STAGING_SMOKE_TEST_CHECKLIST.md`.

## 6. Kiểm Tra Privacy

Trước khi gửi link:

- Không nhập dữ liệu khách thật quá nhạy cảm trong giai đoạn test.
- Không log phone/email/note content trong console.
- PostHog chỉ track event metadata.
- Clarity phải mask input chứa PII nếu bật.
- Không bật AI nếu chưa kiểm soát key và chi phí.
- Không bật payment gateway nếu webhook chưa test xong.

## 7. Tiêu Chí Gửi Link Cho Tester

Chỉ gửi link khi:

- `npm run build` pass.
- `npm run smoke:staging` pass.
- Register/login hoạt động.
- Lead/note/reminder hoạt động.
- Import nhỏ hoạt động hoặc có lỗi thân thiện.
- Admin route chặn non-admin.
- AI/payment không crash khi đang tắt.
- Supabase staging không trỏ vào production.
- Rollback trên hosting đã biết cách thao tác.
