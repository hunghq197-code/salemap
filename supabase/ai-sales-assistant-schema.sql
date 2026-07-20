create extension if not exists pgcrypto;

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  request_type text not null,
  input_prompt text,
  input_context jsonb,
  output_text text,
  output_metadata jsonb,
  provider text default 'default_llm',
  model_name text,
  status text default 'completed',
  error_code text,
  error_message text,
  tokens_input integer,
  tokens_output integer,
  estimated_cost integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_ai_requests_user_created_at
on public.ai_requests(user_id, created_at desc);

create index if not exists idx_ai_requests_lead_id
on public.ai_requests(lead_id);

create index if not exists idx_ai_requests_request_type
on public.ai_requests(request_type);

create index if not exists idx_ai_requests_status
on public.ai_requests(status);

alter table public.ai_requests enable row level security;

drop policy if exists "Users can view own ai requests" on public.ai_requests;
create policy "Users can view own ai requests"
on public.ai_requests for select
using (auth.uid() = user_id);

create table if not exists public.ai_saved_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  ai_request_id uuid references public.ai_requests(id) on delete set null,
  title text,
  content text not null,
  output_type text not null,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ai_saved_outputs_user_created_at
on public.ai_saved_outputs(user_id, created_at desc);

create index if not exists idx_ai_saved_outputs_lead_created_at
on public.ai_saved_outputs(lead_id, created_at desc);

alter table public.ai_saved_outputs enable row level security;

drop policy if exists "Users can view own ai saved outputs" on public.ai_saved_outputs;
create policy "Users can view own ai saved outputs"
on public.ai_saved_outputs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai saved outputs" on public.ai_saved_outputs;
create policy "Users can insert own ai saved outputs"
on public.ai_saved_outputs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai saved outputs" on public.ai_saved_outputs;
create policy "Users can update own ai saved outputs"
on public.ai_saved_outputs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own ai saved outputs" on public.ai_saved_outputs;
create policy "Users can delete own ai saved outputs"
on public.ai_saved_outputs for delete
using (auth.uid() = user_id);

create table if not exists public.daily_usage_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  action_type text not null,
  used_count integer default 0,
  limit_count integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, usage_date, action_type)
);

create index if not exists idx_daily_usage_limits_user_date
on public.daily_usage_limits(user_id, usage_date desc);

alter table public.daily_usage_limits enable row level security;

drop policy if exists "Users can view own daily usage" on public.daily_usage_limits;
create policy "Users can view own daily usage"
on public.daily_usage_limits for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily usage" on public.daily_usage_limits;
create policy "Users can insert own daily usage"
on public.daily_usage_limits for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily usage" on public.daily_usage_limits;
create policy "Users can update own daily usage"
on public.daily_usage_limits for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  flag_key text not null unique,
  name text not null,
  description text,
  is_enabled boolean default true,
  rollout_percentage integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.feature_flags (
  flag_key,
  name,
  description,
  is_enabled,
  rollout_percentage,
  updated_at
)
values (
  'ai_assistant',
  'AI assistant',
  'Tro ly AI viet tin nhan, follow-up, xu ly tu choi va tom tat ghi chu.',
  true,
  100,
  now()
)
on conflict (flag_key)
do nothing;
