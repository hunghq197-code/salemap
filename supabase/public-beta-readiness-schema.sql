create extension if not exists pgcrypto;

create table if not exists public.beta_cohorts (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,
  cohort_key text unique,

  target_user_count integer default 0,
  status text default 'planning',

  started_at timestamptz,
  ended_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.beta_invite_codes (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  label text,
  description text,

  max_uses integer default 1,
  used_count integer default 0,

  assigned_email text,
  assigned_phone text,

  source text,
  cohort_id uuid references public.beta_cohorts(id) on delete set null,

  is_active boolean default true,

  expires_at timestamptz,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_beta_invite_codes_code
on public.beta_invite_codes(code);

create index if not exists idx_beta_invite_codes_active
on public.beta_invite_codes(is_active);

create index if not exists idx_beta_invite_codes_cohort
on public.beta_invite_codes(cohort_id);

create table if not exists public.beta_invite_redemptions (
  id uuid primary key default gen_random_uuid(),

  invite_code_id uuid not null references public.beta_invite_codes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,

  email text,
  phone_zalo text,

  redeemed_at timestamptz default now(),

  metadata jsonb
);

create index if not exists idx_beta_invite_redemptions_user_id
on public.beta_invite_redemptions(user_id);

create index if not exists idx_beta_invite_redemptions_invite_code_id
on public.beta_invite_redemptions(invite_code_id);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),

  flag_key text not null unique,
  name text not null,
  description text,

  is_enabled boolean default false,
  rollout_percentage integer default 100,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_feature_flags (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  flag_key text not null,

  is_enabled boolean not null default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, flag_key)
);

create index if not exists idx_user_feature_flags_user_id
on public.user_feature_flags(user_id);

create index if not exists idx_user_feature_flags_flag_key
on public.user_feature_flags(flag_key);

create table if not exists public.qa_checklists (
  id uuid primary key default gen_random_uuid(),

  checklist_key text not null unique,
  category text default 'product_qa',
  name text not null,
  description text,

  status text default 'pending',
  last_checked_at timestamptz,
  checked_by uuid references auth.users(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint qa_checklists_status_check
    check (status in ('pending', 'passed', 'failed', 'needs_review'))
);

create index if not exists idx_qa_checklists_status
on public.qa_checklists(status);

create index if not exists idx_qa_checklists_category
on public.qa_checklists(category);

alter table public.beta_invite_codes enable row level security;
alter table public.beta_invite_redemptions enable row level security;
alter table public.feature_flags enable row level security;
alter table public.user_feature_flags enable row level security;
alter table public.qa_checklists enable row level security;

insert into public.feature_flags (flag_key, name, description, is_enabled, rollout_percentage)
values
  ('map_discovery', 'Map discovery', 'Tìm khách quanh tôi và theo khu vực.', true, 100),
  ('route_search', 'Route search', 'Tìm khách dọc tuyến đường.', true, 100),
  ('export_csv', 'Export CSV', 'Xuất danh sách lead ra CSV.', true, 100),
  ('template_library', 'Template library', 'Thư viện mẫu gọi điện, Zalo, email và follow-up.', true, 100),
  ('email_notifications', 'Email notifications', 'Email nhắc follow-up và digest hằng ngày.', true, 100),
  ('upgrade_interest', 'Upgrade interest', 'CTA ghi nhận quan tâm nâng cấp gói.', true, 100),
  ('beta_survey', 'User survey', 'Khảo sát trong app cho người dùng.', true, 100),
  ('sample_data', 'Sample data', 'Tạo dữ liệu mẫu cho tài khoản mới.', true, 100)
on conflict (flag_key) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.qa_checklists (checklist_key, category, name, description)
values
  ('register_account', 'product_qa', 'Đăng ký tài khoản', 'User mới có thể tạo tài khoản.'),
  ('login', 'product_qa', 'Đăng nhập', 'User có thể đăng nhập bằng email và mật khẩu.'),
  ('onboarding', 'product_qa', 'Onboarding', 'User hoàn tất onboarding và vào được app.'),
  ('create_lead', 'product_qa', 'Tạo lead', 'User tạo lead cá nhân thủ công.'),
  ('add_note', 'product_qa', 'Thêm ghi chú', 'User thêm ghi chú vào lead.'),
  ('create_reminder', 'product_qa', 'Tạo reminder', 'User tạo lịch follow-up.'),
  ('area_search', 'product_qa', 'Tìm khách theo khu vực', 'Map search theo khu vực hoạt động.'),
  ('route_search', 'product_qa', 'Tìm khách dọc tuyến', 'Route search hoạt động.'),
  ('save_place_as_lead', 'product_qa', 'Lưu địa điểm thành lead', 'User lưu kết quả bản đồ thành lead.'),
  ('export_csv', 'product_qa', 'Export CSV', 'User xuất lead ra CSV.'),
  ('copy_template', 'product_qa', 'Copy template', 'User copy mẫu sale.'),
  ('send_feedback', 'product_qa', 'Gửi feedback', 'User gửi góp ý.'),
  ('notification_center', 'product_qa', 'Notification center', 'Trung tâm thông báo hoạt động.'),
  ('email_reminder_cron', 'product_qa', 'Email reminder cron', 'Cron nhắc follow-up chạy đúng.'),
  ('upgrade_interest', 'product_qa', 'Upgrade interest', 'User gửi quan tâm nâng cấp.'),
  ('admin_dashboard', 'product_qa', 'Admin dashboard', 'Admin xem được dashboard vận hành.'),
  ('retention_cron', 'product_qa', 'Retention cron', 'Cron retention cập nhật health score.'),
  ('invite_code_register', 'product_qa', 'Invite code register', 'Đăng ký bằng invite code hoạt động.'),
  ('production_build_pass', 'launch_qa', 'Production build pass', 'npm run build pass trước khi mở rộng user.'),
  ('landing_page_ok', 'launch_qa', 'Landing page hoạt động', 'Landing page public tải đúng.'),
  ('register_login_ok', 'launch_qa', 'Register/login hoạt động', 'Luồng auth chính hoạt động.'),
  ('invite_code_ok', 'launch_qa', 'Invite code hoạt động', 'Invite code hợp lệ dùng được và hết lượt bị chặn.'),
  ('core_loop_ok', 'launch_qa', 'Core loop hoạt động', 'Lead, note và reminder chạy ổn.'),
  ('map_search_ok', 'launch_qa', 'Map search hoạt động', 'Tìm khách quanh tôi/theo khu vực chạy ổn.'),
  ('route_search_ok', 'launch_qa', 'Route search hoạt động', 'Tìm khách dọc tuyến chạy ổn.'),
  ('quota_ok', 'launch_qa', 'Quota hoạt động', 'Quota cảnh báo và chặn đúng giới hạn.'),
  ('feedback_ok', 'launch_qa', 'Feedback hoạt động', 'User gửi feedback được.'),
  ('admin_ok', 'launch_qa', 'Admin dashboard hoạt động', 'Admin xem các màn vận hành chính.'),
  ('email_reminder_cron_ok', 'launch_qa', 'Email reminder cron hoạt động', 'Cron email reminder không lỗi.'),
  ('retention_cron_ok', 'launch_qa', 'Retention cron hoạt động', 'Cron retention không lỗi.'),
  ('mobile_qa_pass', 'launch_qa', 'Mobile QA pass', 'Các màn chính không vỡ trên mobile.'),
  ('privacy_page_ready', 'launch_qa', 'Privacy page có đủ', 'Trang chính sách bảo mật có nội dung.'),
  ('terms_page_ready', 'launch_qa', 'Terms page có đủ', 'Trang điều khoản sử dụng có nội dung.'),
  ('posthog_event_ok', 'launch_qa', 'PostHog event hoạt động', 'Event chính được gửi không kèm PII.'),
  ('clarity_ok', 'launch_qa', 'Clarity hoạt động', 'Microsoft Clarity được cấu hình đúng.'),
  ('supabase_rls_checked', 'launch_qa', 'Supabase RLS kiểm tra', 'RLS các bảng user-facing đã rà.'),
  ('google_maps_key_restricted', 'launch_qa', 'Google Maps key restricted', 'Google Maps key đã giới hạn domain/API.')
on conflict (checklist_key) do update
set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  updated_at = now();
