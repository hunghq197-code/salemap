create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  type text not null,
  title text not null,
  content text,
  action_url text,

  related_reminder_id uuid references public.reminders(id) on delete set null,
  related_lead_id uuid references public.leads(id) on delete set null,

  read_at timestamptz,
  delivered_in_app boolean default true,
  delivered_email boolean default false,
  email_sent_at timestamptz,

  metadata jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notifications_user_created_at
on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_read_at
on public.notifications(user_id, read_at);

create index if not exists idx_notifications_related_reminder
on public.notifications(related_reminder_id);

create index if not exists idx_notifications_type
on public.notifications(type);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications for select
using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique references auth.users(id) on delete cascade,

  email_reminder_enabled boolean default true,
  daily_digest_enabled boolean default true,
  in_app_notification_enabled boolean default true,
  reminder_email_minutes_before integer default 0,
  daily_digest_time text default '08:00',
  timezone text default 'Asia/Ho_Chi_Minh',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings
add column if not exists email_reminder_enabled boolean default true,
add column if not exists daily_digest_enabled boolean default true,
add column if not exists in_app_notification_enabled boolean default true,
add column if not exists reminder_email_minutes_before integer default 0,
add column if not exists daily_digest_time text default '08:00',
add column if not exists timezone text default 'Asia/Ho_Chi_Minh';

create index if not exists idx_user_settings_user_id
on public.user_settings(user_id);

alter table public.user_settings enable row level security;

drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
on public.user_settings for select
using (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
on public.user_settings for insert
with check (auth.uid() = user_id);

alter table if exists public.reminders
add column if not exists notification_sent_at timestamptz,
add column if not exists email_sent_at timestamptz,
add column if not exists last_notified_at timestamptz;
