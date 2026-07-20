create extension if not exists pgcrypto;

create table if not exists sales_activity_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  leads_created integer default 0,
  leads_contacted integer default 0,
  lead_notes_created integer default 0,
  followups_created integer default 0,
  followups_completed integer default 0,
  overdue_followups integer default 0,
  pipeline_status_changes integer default 0,
  leads_won integer default 0,
  leads_lost integer default 0,
  leads_not_fit integer default 0,
  near_me_searches integer default 0,
  area_searches integer default 0,
  route_searches integer default 0,
  map_leads_saved integer default 0,
  templates_copied integer default 0,
  ai_requests integer default 0,
  exports_completed integer default 0,
  import_jobs_completed integer default 0,
  import_rows_completed integer default 0,
  active_score integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, activity_date)
);

create index if not exists idx_sales_activity_daily_user_date
on sales_activity_daily(user_id, activity_date desc);

create index if not exists idx_sales_activity_daily_date
on sales_activity_daily(activity_date desc);

create index if not exists idx_sales_activity_daily_active_score
on sales_activity_daily(active_score desc);

alter table sales_activity_daily enable row level security;

drop policy if exists "Users can view own sales activity daily" on sales_activity_daily;
create policy "Users can view own sales activity daily"
on sales_activity_daily for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own sales activity daily" on sales_activity_daily;
create policy "Users can insert own sales activity daily"
on sales_activity_daily for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own sales activity daily" on sales_activity_daily;
create policy "Users can update own sales activity daily"
on sales_activity_daily for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists sales_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_key text not null,
  metric_key text not null,
  target_value integer not null,
  period_type text not null default 'weekly',
  period_start date,
  period_end date,
  status text not null default 'active',
  is_pinned boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sales_goals_user_created_at
on sales_goals(user_id, created_at desc);

create index if not exists idx_sales_goals_user_status
on sales_goals(user_id, status);

create index if not exists idx_sales_goals_metric_key
on sales_goals(metric_key);

create index if not exists idx_sales_goals_period
on sales_goals(period_start, period_end);

alter table sales_goals enable row level security;

drop policy if exists "Users can view own sales goals" on sales_goals;
create policy "Users can view own sales goals"
on sales_goals for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own sales goals" on sales_goals;
create policy "Users can insert own sales goals"
on sales_goals for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own sales goals" on sales_goals;
create policy "Users can update own sales goals"
on sales_goals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sales goals" on sales_goals;
create policy "Users can delete own sales goals"
on sales_goals for delete
using (auth.uid() = user_id);

create table if not exists sales_goal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references sales_goals(id) on delete cascade,
  event_type text not null,
  metric_key text,
  previous_value integer,
  new_value integer,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_sales_goal_events_user_created_at
on sales_goal_events(user_id, created_at desc);

create index if not exists idx_sales_goal_events_goal_id
on sales_goal_events(goal_id);

create index if not exists idx_sales_goal_events_event_type
on sales_goal_events(event_type);

alter table sales_goal_events enable row level security;

drop policy if exists "Users can view own sales goal events" on sales_goal_events;
create policy "Users can view own sales goal events"
on sales_goal_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own sales goal events" on sales_goal_events;
create policy "Users can insert own sales goal events"
on sales_goal_events for insert
with check (auth.uid() = user_id);

create table if not exists sales_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  period_type text not null,
  metrics jsonb not null default '{}',
  funnel jsonb not null default '{}',
  source_breakdown jsonb not null default '{}',
  tag_breakdown jsonb not null default '{}',
  category_breakdown jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, snapshot_date, period_type)
);

create index if not exists idx_sales_analytics_snapshots_user_date
on sales_analytics_snapshots(user_id, snapshot_date desc);

create index if not exists idx_sales_analytics_snapshots_period_type
on sales_analytics_snapshots(period_type);

alter table sales_analytics_snapshots enable row level security;

drop policy if exists "Users can view own sales analytics snapshots" on sales_analytics_snapshots;
create policy "Users can view own sales analytics snapshots"
on sales_analytics_snapshots for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own sales analytics snapshots" on sales_analytics_snapshots;
create policy "Users can insert own sales analytics snapshots"
on sales_analytics_snapshots for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own sales analytics snapshots" on sales_analytics_snapshots;
create policy "Users can update own sales analytics snapshots"
on sales_analytics_snapshots for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
