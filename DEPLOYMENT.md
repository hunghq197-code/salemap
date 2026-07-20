# SaleMap Staging Deployment Guide

Mục tiêu của tài liệu này là đưa SaleMap lên môi trường staging tách biệt production để test với 5-10 beta users đầu tiên.

## 1. Yêu Cầu Trước Deploy

- Node.js >= 20.9.0.
- Chỉ dùng staging Supabase project, không trỏ vào production.
- Không commit `.env.local` hoặc secret thật.
- Có quyền set environment variables trên hosting.
- Đã chạy `npm install`, `npm run lint`, `npm run build` local.

## 2. Tạo Supabase Staging

1. Tạo Supabase project mới, tên gợi ý: `salemap-staging`.
2. Chọn region gần beta users.
3. Trong Auth > URL Configuration:
   - Site URL: staging URL.
   - Redirect URLs: staging URL, `/login`, `/register`, `/app/dashboard` nếu cần.
4. Lấy Project URL, anon/publishable key và service role key.

## 3. Chạy Database Migrations

Chạy các file SQL trong Supabase SQL Editor theo thứ tự trong `SUPABASE_SQL_SETUP.md`.

Tối thiểu cần chạy:

1. `supabase/schema.sql`
2. `supabase/product-schema.sql`
3. `supabase/export-template-schema.sql`
4. `supabase/map-discovery-schema.sql`
5. `supabase/route-search-schema.sql`
6. `supabase/billing-upgrade-interest-schema.sql`
7. `supabase/admin-ops-schema.sql`
8. `supabase/notifications-schema.sql`
9. `supabase/public-beta-readiness-schema.sql`
10. `supabase/manual-payment-subscription-schema.sql`
11. `supabase/import-leads-schema.sql`
12. `supabase/lead-cleanup-bulk-actions-schema.sql`
13. `supabase/lead-pipeline-saved-views-schema.sql`
14. `supabase/personal-sales-analytics-goals-schema.sql`
15. `supabase/payos-payment-gateway-schema.sql`
16. `supabase/ai-sales-assistant-schema.sql`

Nếu Supabase báo table/column đã tồn tại, chỉ chạy lại file đã có `if not exists`, hoặc tạo migration fix-forward nhỏ.

## 4. Seed Data

Chạy:

```bash
npm run seed:staging
```

Script sẽ in hướng dẫn chạy `supabase/seed-staging.sql` trong Supabase SQL Editor.

Seed staging chỉ tạo:

- Template categories.
- 24 templates bán hàng mẫu.
- Feature flags staging.
- Tags mẫu nếu set `salemap.seed_user_id` cho user test.

Không seed lead, note, số điện thoại, email hoặc dữ liệu khách thật.

## 5. Environment Variables

Set theo `.env.example` trên hosting staging.

Biến bắt buộc:

```env
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Khuyến nghị staging ban đầu:

```env
NEXT_PUBLIC_ENABLE_AI_ASSISTANT=false
NEXT_PUBLIC_ENABLE_PAYMENT_GATEWAY=false
AI_PROVIDER=
AI_API_KEY=
PAYMENT_PROVIDER=
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
```

Google Maps chỉ bật khi đã có key staging/domain restriction.

## 6. Build Local

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=moderate
```

Kỳ vọng hiện tại:

- TypeScript pass.
- Lint pass, có thể còn warning migration React Hooks cần xử lý ở sprint code-quality riêng.
- Build pass.
- Audit 0 vulnerability.

## 7. Deploy Lên Vercel Hoặc Hosting Hiện Tại

1. Tạo project staging trên Vercel/hosting.
2. Trỏ branch staging hoặc commit hiện tại.
3. Set toàn bộ env staging.
4. Build command: `npm run build`.
5. Output/framework: Next.js.
6. Deploy.
7. Sau deploy, mở staging URL và chạy `STAGING_SMOKE_TEST_CHECKLIST.md`.

## 8. Tạo Admin Test Account

1. Đăng ký user bằng email test trên staging.
2. Vào Supabase > Authentication > Users, copy user id.
3. Vào SQL Editor và chạy:

```sql
update public.user_profiles
set is_admin = true
where user_id = 'REPLACE_WITH_TEST_USER_ID';
```

4. Logout/login lại.
5. Mở `/admin`.
6. Không hardcode admin email trong source.

## 9. Bật/Tắt Feature Flags

Ưu tiên bật staging:

- `map_discovery`
- `route_search`
- `export_csv`
- `template_library`
- `upgrade_interest`
- `sample_data`
- `import_leads`
- `offline_pwa`
- `cleanup_tools`
- `pipeline`
- `analytics`

Nên tắt nếu chưa test key thật:

- `ai_assistant`
- `payment_gateway`
- `email_notifications`

Nếu cần disable module nhanh:

```sql
update public.feature_flags
set is_enabled = false, rollout_percentage = 0, updated_at = now()
where flag_key = 'ai_assistant';
```

## 10. Smoke Test Trước Khi Gửi Link

Chạy theo `STAGING_SMOKE_TEST_CHECKLIST.md`.

Tối thiểu phải pass:

- Public routes không crash.
- Register/login/logout.
- Protected routes redirect đúng.
- Tạo lead, note, reminder.
- Import CSV/XLSX nhỏ.
- Pipeline và analytics mở được.
- Admin routes chặn non-admin.
- AI/payment thiếu key không crash.

## 11. Monitoring

Hiện sprint staging không bắt buộc cài Sentry.

Nếu bật Sentry sau này:

- Set `SENTRY_DSN` và `NEXT_PUBLIC_SENTRY_DSN` trong staging env.
- Không upload source maps public nếu chưa cấu hình an toàn.
- Error boundary không được nuốt lỗi quan trọng.
- Không gửi PII trong error context.

Nếu chưa bật Sentry:

- Theo dõi Vercel/hosting logs.
- Theo dõi PostHog event lỗi đã được sanitize.
- Ghi lỗi P0/P1 vào checklist QA trong 24h đầu.

## 12. Rollback Plan

Frontend rollback:

1. Revert deployment về bản trước trên hosting.
2. Hoặc redeploy commit trước.
3. Không rollback bằng cách xóa env đang dùng nếu beta user đang test.

Database rollback:

1. Không xóa migration đã chạy nếu đã có data.
2. Nếu migration gây lỗi nghiêm trọng, tạo migration fix-forward.
3. Trước migration lớn, backup staging database.

Disable module nhanh:

1. Tắt feature flag.
2. Ẩn menu nếu đã có gating.
3. Route trực tiếp vẫn phải hiển thị message thân thiện, không crash.

## 13. Checklist Gửi Beta Link

- [ ] `npm run build` pass.
- [ ] Env staging đã set đủ.
- [ ] Supabase staging không trỏ production.
- [ ] RLS enabled cho bảng user-owned.
- [ ] Admin test account hoạt động.
- [ ] AI/payment/email tắt nếu chưa có key thật.
- [ ] Privacy/terms mở được.
- [ ] PostHog/Clarity không gửi PII.
- [ ] Có rollback plan.
- [ ] Có form/kênh nhận feedback.
