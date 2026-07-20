-- This file is self-contained for Revenue Ops.
-- It creates the base manual payment tables if they do not exist, then extends
-- them with renewal/churn/revenue tables.

create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique references auth.users(id) on delete cascade,

  plan_key text not null default 'free_beta',
  plan_name text not null default 'Free',

  status text not null default 'active',

  current_period_start timestamptz,
  current_period_end timestamptz,

  activated_at timestamptz,
  cancelled_at timestamptz,

  payment_method text default 'manual',
  latest_payment_request_id uuid,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions
add column if not exists plan_key text default 'free_beta',
add column if not exists plan_name text default 'Free',
add column if not exists status text default 'active',
add column if not exists current_period_start timestamptz,
add column if not exists current_period_end timestamptz,
add column if not exists activated_at timestamptz,
add column if not exists cancelled_at timestamptz,
add column if not exists payment_method text default 'manual',
add column if not exists latest_payment_request_id uuid;

create index if not exists idx_subscriptions_user_id
on public.subscriptions(user_id);

create index if not exists idx_subscriptions_plan_key
on public.subscriptions(plan_key);

create index if not exists idx_subscriptions_status
on public.subscriptions(status);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  plan_key text not null,
  plan_name text not null,
  amount_vnd integer not null,
  billing_period text not null default 'monthly',

  status text not null default 'pending',

  bank_account_name text,
  bank_account_number text,
  bank_name text,
  transfer_content text,

  user_note text,
  transaction_reference text,
  proof_url text,

  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  activated_subscription_id uuid references public.subscriptions(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint payment_requests_status_check
    check (status in ('pending', 'waiting_confirmation', 'paid', 'rejected', 'cancelled', 'expired'))
);

create index if not exists idx_payment_requests_user_created_at
on public.payment_requests(user_id, created_at desc);

create index if not exists idx_payment_requests_status
on public.payment_requests(status);

create index if not exists idx_payment_requests_plan_key
on public.payment_requests(plan_key);

create index if not exists idx_payment_requests_created_at
on public.payment_requests(created_at desc);

alter table public.subscriptions enable row level security;
alter table public.payment_requests enable row level security;

drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
on public.subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Users can view own payment requests" on public.payment_requests;
create policy "Users can view own payment requests"
on public.payment_requests for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own payment requests" on public.payment_requests;
create policy "Users can insert own payment requests"
on public.payment_requests for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own pending payment requests" on public.payment_requests;
create policy "Users can update own pending payment requests"
on public.payment_requests for update
using (
  auth.uid() = user_id
  and status in ('pending', 'waiting_confirmation')
)
with check (
  auth.uid() = user_id
  and status in ('pending', 'waiting_confirmation', 'cancelled')
);

alter table public.subscriptions
add column if not exists auto_renew boolean default false,
add column if not exists renewal_reminder_sent_at timestamptz,
add column if not exists expired_processed_at timestamptz,
add column if not exists cancel_reason text,
add column if not exists cancelled_by_user_at timestamptz,
add column if not exists grace_period_end timestamptz;

alter table public.payment_requests
add column if not exists request_type text default 'new_subscription',
add column if not exists months integer default 1;

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_request_id uuid references public.payment_requests(id) on delete set null,

  event_type text not null,
  from_plan_key text,
  to_plan_key text,

  previous_period_end timestamptz,
  new_period_start timestamptz,
  new_period_end timestamptz,

  amount_vnd integer,
  months integer default 1,

  note text,
  created_by uuid references auth.users(id) on delete set null,

  created_at timestamptz default now()
);

create index if not exists idx_subscription_events_user_created_at
on public.subscription_events(user_id, created_at desc);

create index if not exists idx_subscription_events_type
on public.subscription_events(event_type);

create index if not exists idx_subscription_events_created_at
on public.subscription_events(created_at desc);

create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,

  reason_type text not null,
  reason_detail text,
  would_return_if text,

  status text default 'new',

  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_cancellation_requests_user_created_at
on public.cancellation_requests(user_id, created_at desc);

create index if not exists idx_cancellation_requests_status
on public.cancellation_requests(status);

create index if not exists idx_cancellation_requests_reason_type
on public.cancellation_requests(reason_type);

create table if not exists public.revenue_snapshots_daily (
  id uuid primary key default gen_random_uuid(),

  snapshot_date date not null unique,

  active_paid_users integer default 0,
  active_pro_users integer default 0,
  active_pro_plus_users integer default 0,

  mrr_vnd integer default 0,
  manual_revenue_vnd integer default 0,

  new_paid_users integer default 0,
  renewed_users integer default 0,
  expired_users integer default 0,
  cancellation_requests integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscription_events enable row level security;
alter table public.cancellation_requests enable row level security;

drop policy if exists "Users can view own subscription events" on public.subscription_events;
create policy "Users can view own subscription events"
on public.subscription_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can view own cancellation requests" on public.cancellation_requests;
create policy "Users can view own cancellation requests"
on public.cancellation_requests for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own cancellation requests" on public.cancellation_requests;
create policy "Users can insert own cancellation requests"
on public.cancellation_requests for insert
with check (auth.uid() = user_id);
