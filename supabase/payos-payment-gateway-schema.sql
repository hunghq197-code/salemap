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
  cancelled_by_user_at timestamptz,
  cancel_reason text,
  expired_processed_at timestamptz,
  grace_period_end timestamptz,
  payment_method text default 'manual',
  latest_payment_request_id uuid,
  auto_renew boolean default false,
  renewal_reminder_sent_at timestamptz,
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
add column if not exists cancelled_by_user_at timestamptz,
add column if not exists cancel_reason text,
add column if not exists expired_processed_at timestamptz,
add column if not exists grace_period_end timestamptz,
add column if not exists payment_method text default 'manual',
add column if not exists latest_payment_request_id uuid,
add column if not exists auto_renew boolean default false,
add column if not exists renewal_reminder_sent_at timestamptz;

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null,
  plan_name text not null,
  amount_vnd integer not null,
  billing_period text not null default 'monthly',
  months integer default 1,
  request_type text default 'new_subscription',
  status text not null default 'pending',
  provider text default 'manual',
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
  checkout_url text,
  order_code bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payment_requests
add column if not exists months integer default 1,
add column if not exists request_type text default 'new_subscription',
add column if not exists provider text default 'manual',
add column if not exists checkout_url text,
add column if not exists order_code bigint;

create table if not exists public.payment_gateway_transactions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  payment_request_id uuid references public.payment_requests(id) on delete set null,

  provider text not null default 'payos',

  order_code bigint not null unique,
  payment_link_id text,
  checkout_url text,
  qr_code text,

  plan_key text not null,
  plan_name text not null,
  amount_vnd integer not null,
  billing_period text default 'monthly',
  months integer default 1,

  status text not null default 'pending',

  provider_status text,
  provider_reference text,
  provider_transaction_datetime text,

  return_url text,
  cancel_url text,

  raw_create_response jsonb,
  raw_webhook_payload jsonb,
  raw_status_response jsonb,

  paid_at timestamptz,
  cancelled_at timestamptz,
  expired_at timestamptz,

  subscription_id uuid references public.subscriptions(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payment_requests
add column if not exists gateway_transaction_id uuid references public.payment_gateway_transactions(id) on delete set null;

create index if not exists idx_payment_gateway_transactions_user_created_at
on public.payment_gateway_transactions(user_id, created_at desc);

create index if not exists idx_payment_gateway_transactions_order_code
on public.payment_gateway_transactions(order_code);

create index if not exists idx_payment_gateway_transactions_payment_link_id
on public.payment_gateway_transactions(payment_link_id);

create index if not exists idx_payment_gateway_transactions_status
on public.payment_gateway_transactions(status);

create index if not exists idx_payment_gateway_transactions_provider
on public.payment_gateway_transactions(provider);

create index if not exists idx_payment_requests_gateway_transaction_id
on public.payment_requests(gateway_transaction_id);

create index if not exists idx_payment_requests_order_code
on public.payment_requests(order_code);

create index if not exists idx_payment_requests_provider
on public.payment_requests(provider);

alter table public.payment_gateway_transactions enable row level security;

drop policy if exists "Users can view own payment gateway transactions"
on public.payment_gateway_transactions;
create policy "Users can view own payment gateway transactions"
on public.payment_gateway_transactions for select
using (auth.uid() = user_id);
