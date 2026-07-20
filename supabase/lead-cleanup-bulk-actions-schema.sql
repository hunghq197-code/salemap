-- Lead Cleanup + Deduplication + Bulk Actions MVP
-- Run this file in Supabase SQL Editor after the core product schema.

alter table leads
add column if not exists merged_into_lead_id uuid references leads(id) on delete set null,
add column if not exists merged_at timestamptz,
add column if not exists archived_at timestamptz,
add column if not exists deleted_at timestamptz;

create index if not exists idx_leads_user_deleted_merged on leads(user_id, deleted_at, merged_at);
create index if not exists idx_leads_merged_into_lead_id on leads(merged_into_lead_id);
create index if not exists idx_leads_archived_at on leads(archived_at);

create table if not exists lead_merge_groups (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  status text not null default 'suggested',
  duplicate_reason text,
  confidence_score integer default 0,

  lead_ids uuid[] not null default '{}',
  primary_lead_id uuid references leads(id) on delete set null,

  reviewed_at timestamptz,
  merged_at timestamptz,
  dismissed_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lead_merge_groups_user_created_at on lead_merge_groups(user_id, created_at desc);
create index if not exists idx_lead_merge_groups_status on lead_merge_groups(status);
create index if not exists idx_lead_merge_groups_primary_lead_id on lead_merge_groups(primary_lead_id);

alter table lead_merge_groups enable row level security;

drop policy if exists "Users can view own lead merge groups" on lead_merge_groups;
create policy "Users can view own lead merge groups"
on lead_merge_groups for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lead merge groups" on lead_merge_groups;
create policy "Users can insert own lead merge groups"
on lead_merge_groups for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lead merge groups" on lead_merge_groups;
create policy "Users can update own lead merge groups"
on lead_merge_groups for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists lead_merge_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  merge_group_id uuid references lead_merge_groups(id) on delete set null,
  primary_lead_id uuid not null references leads(id) on delete cascade,
  merged_lead_ids uuid[] not null default '{}',

  merge_strategy jsonb,
  before_snapshot jsonb,
  after_snapshot jsonb,

  created_at timestamptz default now()
);

create index if not exists idx_lead_merge_events_user_created_at on lead_merge_events(user_id, created_at desc);
create index if not exists idx_lead_merge_events_primary_lead_id on lead_merge_events(primary_lead_id);

alter table lead_merge_events enable row level security;

drop policy if exists "Users can view own lead merge events" on lead_merge_events;
create policy "Users can view own lead merge events"
on lead_merge_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lead merge events" on lead_merge_events;
create policy "Users can insert own lead merge events"
on lead_merge_events for insert
with check (auth.uid() = user_id);

create table if not exists lead_data_quality_issues (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,

  issue_type text not null,
  field_name text,
  severity text not null default 'warning',

  message text not null,
  suggested_value text,

  status text not null default 'open',

  resolved_at timestamptz,
  dismissed_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lead_data_quality_user_created_at on lead_data_quality_issues(user_id, created_at desc);
create index if not exists idx_lead_data_quality_lead_id on lead_data_quality_issues(lead_id);
create index if not exists idx_lead_data_quality_status on lead_data_quality_issues(status);
create index if not exists idx_lead_data_quality_issue_type on lead_data_quality_issues(issue_type);
create unique index if not exists idx_lead_data_quality_open_unique
on lead_data_quality_issues(lead_id, issue_type, coalesce(field_name, ''))
where status = 'open';

alter table lead_data_quality_issues enable row level security;

drop policy if exists "Users can view own data quality issues" on lead_data_quality_issues;
create policy "Users can view own data quality issues"
on lead_data_quality_issues for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own data quality issues" on lead_data_quality_issues;
create policy "Users can insert own data quality issues"
on lead_data_quality_issues for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own data quality issues" on lead_data_quality_issues;
create policy "Users can update own data quality issues"
on lead_data_quality_issues for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists bulk_action_jobs (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  action_type text not null,
  status text not null default 'pending',

  target_lead_ids uuid[] not null default '{}',
  filters jsonb,
  payload jsonb,

  total_count integer default 0,
  success_count integer default 0,
  failed_count integer default 0,

  error_summary jsonb,

  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_bulk_action_jobs_user_created_at on bulk_action_jobs(user_id, created_at desc);
create index if not exists idx_bulk_action_jobs_status on bulk_action_jobs(status);
create index if not exists idx_bulk_action_jobs_action_type on bulk_action_jobs(action_type);

alter table bulk_action_jobs enable row level security;

drop policy if exists "Users can view own bulk action jobs" on bulk_action_jobs;
create policy "Users can view own bulk action jobs"
on bulk_action_jobs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own bulk action jobs" on bulk_action_jobs;
create policy "Users can insert own bulk action jobs"
on bulk_action_jobs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own bulk action jobs" on bulk_action_jobs;
create policy "Users can update own bulk action jobs"
on bulk_action_jobs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
