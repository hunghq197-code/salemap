# SaleMap Staging Database Checklist

## Supabase Staging Setup

- [ ] Tạo Supabase project staging riêng.
- [ ] Không dùng production database.
- [ ] Set Auth Site URL bằng staging URL.
- [ ] Set Redirect URLs cho login/register/dashboard.
- [ ] Lưu URL, anon/publishable key và service role key vào hosting env, không commit secret.

## Apply Migration Theo Thứ Tự

- [ ] `supabase/schema.sql`
- [ ] `supabase/product-schema.sql`
- [ ] `supabase/export-template-schema.sql`
- [ ] `supabase/map-discovery-schema.sql`
- [ ] `supabase/route-search-schema.sql`
- [ ] `supabase/billing-upgrade-interest-schema.sql`
- [ ] `supabase/admin-ops-schema.sql`
- [ ] `supabase/notifications-schema.sql`
- [ ] `supabase/public-beta-readiness-schema.sql`
- [ ] `supabase/manual-payment-subscription-schema.sql`
- [ ] `supabase/import-leads-schema.sql`
- [ ] `supabase/lead-cleanup-bulk-actions-schema.sql`
- [ ] `supabase/lead-pipeline-saved-views-schema.sql`
- [ ] `supabase/personal-sales-analytics-goals-schema.sql`
- [ ] `supabase/payos-payment-gateway-schema.sql`
- [ ] `supabase/ai-sales-assistant-schema.sql`
- [ ] `supabase/seed-staging.sql`

## Bảng Chính Cần Có

- [ ] `user_profiles`
- [ ] `leads`
- [ ] `lead_notes`
- [ ] `reminders`
- [ ] `tags`
- [ ] `lead_tags`
- [ ] `map_searches`
- [ ] `routes`
- [ ] `route_stops`
- [ ] `template_categories`
- [ ] `templates`
- [ ] `export_jobs`
- [ ] `beta_feedback`
- [ ] `subscriptions`
- [ ] `payment_requests`
- [ ] `notifications`
- [ ] `import_jobs`
- [ ] `import_rows`
- [ ] `lead_merge_groups`
- [ ] `lead_saved_views`
- [ ] `sales_goals`

## RLS Và Quyền Truy Cập

- [ ] RLS enabled cho bảng user-owned: `user_profiles`, `leads`, `lead_notes`, `reminders`, `tags`, `lead_tags`, `map_searches`, `routes`, `route_stops`, `export_jobs`, `import_jobs`, `import_rows`, `lead_saved_views`, `sales_goals`.
- [ ] User A không đọc được lead/user data của user B.
- [ ] User A không thấy import job của user B.
- [ ] User A không thấy reminder/tag của user B.
- [ ] Non-admin không vào được `/admin`.
- [ ] Admin chỉ hoạt động khi `user_profiles.is_admin = true`.
- [ ] Service role key chỉ dùng ở server/API/admin jobs.

## Seed Và Dữ Liệu Demo

- [ ] Template categories đã có dữ liệu.
- [ ] Templates staging đã có 20-30 mẫu.
- [ ] Feature flags staging đã có bản ghi.
- [ ] Tags mẫu chỉ seed cho user test nếu đã set `salemap.seed_user_id`.
- [ ] Không seed dữ liệu khách hàng thật.
- [ ] Smart views được ensure khi user mở lead views/pipeline.

## Kiểm Tra Sau Migration

- [ ] Register tạo được auth user.
- [ ] `user_profiles` được tạo sau register/onboarding.
- [ ] Tạo lead thủ công không lỗi.
- [ ] Tạo note/reminder không lỗi.
- [ ] Import CSV/XLSX tạo `import_jobs` và `import_rows`.
- [ ] Feature flag tắt không làm route crash.
