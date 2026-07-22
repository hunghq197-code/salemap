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
add column if not exists plan_id text default 'free',
add column if not exists plan_key text default 'free_beta',
add column if not exists plan_name text default 'Free',
add column if not exists status text default 'active',
add column if not exists billing_period text default 'monthly',
add column if not exists started_at timestamptz default now(),
add column if not exists current_period_start timestamptz default now(),
add column if not exists current_period_end timestamptz,
add column if not exists trial_ends_at timestamptz,
add column if not exists grace_ends_at timestamptz,
add column if not exists grace_period_end timestamptz,
add column if not exists cancelled_at timestamptz,
add column if not exists cancelled_by_user_at timestamptz,
add column if not exists cancel_reason text,
add column if not exists provider text,
add column if not exists provider_subscription_id text,
add column if not exists payment_method text default 'manual',
add column if not exists latest_payment_request_id uuid,
add column if not exists expired_processed_at timestamptz,
add column if not exists auto_renew boolean default false,
add column if not exists renewal_reminder_sent_at timestamptz,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

update public.subscriptions
set plan_id = case
  when plan_key = 'pro' then 'pro'
  when plan_key = 'pro_plus' then 'pro_plus'
  else 'free'
end
where plan_id is null or plan_id = '';

create index if not exists idx_subscriptions_user_id
on public.subscriptions(user_id);

create index if not exists idx_subscriptions_status
on public.subscriptions(status);

create index if not exists idx_subscriptions_period_end
on public.subscriptions(current_period_end);

create index if not exists idx_subscriptions_plan
on public.subscriptions(plan_id);

create index if not exists idx_subscriptions_plan_key
on public.subscriptions(plan_key);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,

  provider text not null default 'manual_bank_transfer',

  order_code bigint not null,
  payment_code text,
  payment_link_id text,
  transaction_reference text,

  plan_id text not null,
  billing_period text default 'monthly',
  amount integer not null,
  currency text default 'VND',

  status text not null default 'pending',

  checkout_url text,
  qr_code text,

  bank_name text,
  bank_account_number text,
  bank_account_name text,
  transfer_content text,

  description text,
  admin_note text,

  provider_payload jsonb default '{}'::jsonb,

  user_confirmed_transfer_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  expired_at timestamptz,
  failed_at timestamptz,

  failure_reason text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(order_code)
);

alter table public.payments
add column if not exists subscription_id uuid references public.subscriptions(id) on delete set null,
add column if not exists provider text default 'manual_bank_transfer',
add column if not exists order_code bigint,
add column if not exists payment_code text,
add column if not exists payment_link_id text,
add column if not exists transaction_reference text,
add column if not exists plan_id text,
add column if not exists billing_period text default 'monthly',
add column if not exists amount integer,
add column if not exists currency text default 'VND',
add column if not exists status text default 'pending',
add column if not exists checkout_url text,
add column if not exists qr_code text,
add column if not exists bank_name text,
add column if not exists bank_account_number text,
add column if not exists bank_account_name text,
add column if not exists transfer_content text,
add column if not exists description text,
add column if not exists admin_note text,
add column if not exists provider_payload jsonb default '{}'::jsonb,
add column if not exists user_confirmed_transfer_at timestamptz,
add column if not exists paid_at timestamptz,
add column if not exists cancelled_at timestamptz,
add column if not exists expired_at timestamptz,
add column if not exists failed_at timestamptz,
add column if not exists failure_reason text,
add column if not exists created_at timestamptz default now(),
add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_payments_order_code_unique
on public.payments(order_code);

create index if not exists idx_payments_user_id
on public.payments(user_id, created_at desc);

create index if not exists idx_payments_subscription_id
on public.payments(subscription_id);

create index if not exists idx_payments_status
on public.payments(status);

create index if not exists idx_payments_provider
on public.payments(provider);

create index if not exists idx_payments_order_code
on public.payments(order_code);

create index if not exists idx_payments_payment_code
on public.payments(payment_code);

create index if not exists idx_payments_payment_link_id
on public.payments(payment_link_id);

create index if not exists idx_payments_created_at
on public.payments(created_at desc);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),

  payment_id uuid references public.payments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,

  provider text,
  event_type text not null,

  order_code bigint,
  payment_link_id text,
  transaction_reference text,

  raw_event jsonb default '{}'::jsonb,
  safe_event jsonb default '{}'::jsonb,

  processed boolean default false,
  processing_error text,

  created_at timestamptz default now()
);

create index if not exists idx_payment_events_payment_id
on public.payment_events(payment_id);

create index if not exists idx_payment_events_order_code
on public.payment_events(order_code);

create index if not exists idx_payment_events_type
on public.payment_events(event_type);

create index if not exists idx_payment_events_created_at
on public.payment_events(created_at desc);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),

  subscription_id uuid references public.subscriptions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,

  event_type text not null,
  from_plan_id text,
  to_plan_id text,
  from_status text,
  to_status text,

  payment_id uuid references public.payments(id) on delete set null,
  payment_request_id uuid,

  from_plan_key text,
  to_plan_key text,

  previous_period_end timestamptz,
  new_period_start timestamptz,
  new_period_end timestamptz,

  amount_vnd integer,
  months integer default 1,
  note text,

  metadata jsonb default '{}'::jsonb,

  created_by uuid references auth.users(id) on delete set null,

  created_at timestamptz default now()
);

alter table public.subscription_events
add column if not exists from_plan_id text,
add column if not exists to_plan_id text,
add column if not exists from_status text,
add column if not exists to_status text,
add column if not exists payment_id uuid references public.payments(id) on delete set null,
add column if not exists payment_request_id uuid,
add column if not exists metadata jsonb default '{}'::jsonb,
add column if not exists from_plan_key text,
add column if not exists to_plan_key text,
add column if not exists previous_period_end timestamptz,
add column if not exists new_period_start timestamptz,
add column if not exists new_period_end timestamptz,
add column if not exists amount_vnd integer,
add column if not exists months integer default 1,
add column if not exists note text,
add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists idx_subscription_events_user
on public.subscription_events(user_id, created_at desc);

create index if not exists idx_subscription_events_subscription
on public.subscription_events(subscription_id);

create index if not exists idx_subscription_events_payment_id
on public.subscription_events(payment_id);

create index if not exists idx_subscription_events_type
on public.subscription_events(event_type);

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
on public.subscriptions for select
using (auth.uid() = user_id);

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
on public.payments for select
using (auth.uid() = user_id);

drop policy if exists "Users can view own payment events" on public.payment_events;
create policy "Users can view own payment events"
on public.payment_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can view own subscription events" on public.subscription_events;
create policy "Users can view own subscription events"
on public.subscription_events for select
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();
