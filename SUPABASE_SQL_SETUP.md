# SaleMap Supabase SQL Setup

Chạy các file SQL trong Supabase Dashboard > SQL Editor theo đúng thứ tự dưới đây.
Mỗi lần chạy hãy copy toàn bộ nội dung của một file, không copy từ giữa file.

## Thứ Tự Bắt Buộc

1. `supabase/schema.sql`
2. `supabase/product-schema.sql`
3. `supabase/map-discovery-schema.sql`
4. `supabase/route-search-schema.sql`
5. `supabase/beta-testing-schema.sql`
6. `supabase/export-template-schema.sql`
7. `supabase/seed-templates.sql`
8. `supabase/billing-upgrade-interest-schema.sql`
9. `supabase/admin-ops-schema.sql`
10. `supabase/notifications-schema.sql`
11. `supabase/retention-beta-round-2-schema.sql`
12. `supabase/public-beta-readiness-schema.sql`
13. `supabase/manual-payment-subscription-schema.sql`
14. `supabase/revenue-renewal-churn-schema.sql`
15. `supabase/payos-payment-gateway-schema.sql`
16. `supabase/ai-sales-assistant-schema.sql`
17. `supabase/import-leads-schema.sql`
18. `supabase/lead-cleanup-bulk-actions-schema.sql`
19. `supabase/lead-pipeline-saved-views-schema.sql`
20. `supabase/personal-sales-analytics-goals-schema.sql`
21. `supabase/follow-up-task-center-schema.sql`

## Khi Nào Cần Chạy Lại

- Nếu dashboard báo thiếu `lead_saved_views`, chạy file số 19.
- Nếu dashboard báo thiếu `sales_goals` hoặc `sales_activity_daily`, chạy file số 20.
- Nếu trang `/app/tasks` báo thiếu cột task hoặc bảng `task_events`, chạy file số 21.
- Nếu thư viện mẫu trống do thiếu bảng, chạy file số 6 rồi file số 7.
- Nếu quota/gói sử dụng không lưu được, chạy file số 13 và 14.
- Nếu admin dashboard thiếu dữ liệu beta/public beta, chạy file số 8 đến 12.

## Kết Quả Đúng

Supabase thường trả về `Success. No rows returned`. Đây là kết quả bình thường với các lệnh tạo bảng, index, policy và trigger.

Sau khi chạy SQL, refresh app hoặc restart dev server để Supabase schema cache nhận bảng mới.
