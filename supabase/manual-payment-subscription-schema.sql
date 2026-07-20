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
