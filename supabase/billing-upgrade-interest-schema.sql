create extension if not exists pgcrypto;

create table if not exists upgrade_interests (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users(id) on delete set null,

  plan_key text not null,
  plan_name text not null,

  reason text,
  expected_price text,
  main_feature_interest text,

  current_role_type text,
  industry text,

  source_page text default 'billing',
  status text default 'new',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_upgrade_interests_user_id
on upgrade_interests(user_id);

create index if not exists idx_upgrade_interests_plan_key
on upgrade_interests(plan_key);

create index if not exists idx_upgrade_interests_created_at
on upgrade_interests(created_at desc);

create index if not exists idx_upgrade_interests_status
on upgrade_interests(status);

alter table upgrade_interests enable row level security;

drop policy if exists "Users can insert own upgrade interests" on upgrade_interests;
create policy "Users can insert own upgrade interests"
on upgrade_interests for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can view own upgrade interests" on upgrade_interests;
create policy "Users can view own upgrade interests"
on upgrade_interests for select
using (auth.uid() = user_id);
