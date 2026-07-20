-- Lead Pipeline + Smart Segments + Saved Views MVP
-- Run this file in Supabase SQL Editor after the core product schema.

alter table leads
add column if not exists pipeline_position integer default 0,
add column if not exists status_changed_at timestamptz;

create index if not exists idx_leads_user_status_changed_at on leads(user_id, status, status_changed_at desc);
create index if not exists idx_leads_pipeline_position on leads(user_id, status, pipeline_position);

create table if not exists lead_saved_views (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  description text,

  view_key text,
  view_type text not null default 'custom',

  filters jsonb not null default '{}',
  sort_by text default 'updated_at',
  sort_direction text default 'desc',

  is_pinned boolean default false,
  is_default boolean default false,
  is_system boolean default false,

  icon text,
  color text,

  usage_count integer default 0,
  last_used_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lead_saved_views_user_created_at on lead_saved_views(user_id, created_at desc);
create index if not exists idx_lead_saved_views_user_pinned on lead_saved_views(user_id, is_pinned);
create index if not exists idx_lead_saved_views_view_type on lead_saved_views(view_type);
create index if not exists idx_lead_saved_views_view_key on lead_saved_views(view_key);

create unique index if not exists idx_lead_saved_views_user_view_key_unique
on lead_saved_views(user_id, view_key)
where view_key is not null;

alter table lead_saved_views enable row level security;

drop policy if exists "Users can view own lead saved views" on lead_saved_views;
create policy "Users can view own lead saved views"
on lead_saved_views for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lead saved views" on lead_saved_views;
create policy "Users can insert own lead saved views"
on lead_saved_views for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lead saved views" on lead_saved_views;
create policy "Users can update own lead saved views"
on lead_saved_views for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lead saved views" on lead_saved_views;
create policy "Users can delete own lead saved views"
on lead_saved_views for delete
using (auth.uid() = user_id and is_system = false);

create table if not exists lead_pipeline_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,

  from_status text,
  to_status text not null,

  changed_from text default 'pipeline',
  note text,

  created_at timestamptz default now()
);

create index if not exists idx_lead_pipeline_events_user_created_at on lead_pipeline_events(user_id, created_at desc);
create index if not exists idx_lead_pipeline_events_lead_id on lead_pipeline_events(lead_id);
create index if not exists idx_lead_pipeline_events_to_status on lead_pipeline_events(to_status);

alter table lead_pipeline_events enable row level security;

drop policy if exists "Users can view own pipeline events" on lead_pipeline_events;
create policy "Users can view own pipeline events"
on lead_pipeline_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own pipeline events" on lead_pipeline_events;
create policy "Users can insert own pipeline events"
on lead_pipeline_events for insert
with check (auth.uid() = user_id);

create table if not exists lead_view_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  saved_view_id uuid references lead_saved_views(id) on delete set null,

  event_type text not null,
  metadata jsonb,

  created_at timestamptz default now()
);

create index if not exists idx_lead_view_events_user_created_at on lead_view_events(user_id, created_at desc);
create index if not exists idx_lead_view_events_saved_view_id on lead_view_events(saved_view_id);

alter table lead_view_events enable row level security;

drop policy if exists "Users can view own lead view events" on lead_view_events;
create policy "Users can view own lead view events"
on lead_view_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lead view events" on lead_view_events;
create policy "Users can insert own lead view events"
on lead_view_events for insert
with check (auth.uid() = user_id);
