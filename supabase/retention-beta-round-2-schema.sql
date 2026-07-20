create extension if not exists pgcrypto;

create table if not exists public.user_activity_daily (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  activity_date date not null,

  sessions_count integer default 0,
  dashboard_views integer default 0,

  leads_created integer default 0,
  lead_notes_created integer default 0,
  reminders_created integer default 0,
  reminders_completed integer default 0,

  near_me_searches integer default 0,
  area_searches integer default 0,
  route_searches integer default 0,
  map_places_saved integer default 0,

  templates_copied integer default 0,
  exports_completed integer default 0,

  notifications_read integer default 0,
  feedback_submitted integer default 0,
  upgrade_interest_submitted integer default 0,

  active_score integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, activity_date)
);

create index if not exists idx_user_activity_daily_user_date
on public.user_activity_daily(user_id, activity_date desc);

create index if not exists idx_user_activity_daily_date
on public.user_activity_daily(activity_date desc);

create index if not exists idx_user_activity_daily_active_score
on public.user_activity_daily(active_score desc);

alter table public.user_activity_daily enable row level security;

create table if not exists public.user_health_scores (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique references auth.users(id) on delete cascade,

  health_score integer default 0,
  health_label text default 'unknown',

  last_active_at timestamptz,
  first_active_at timestamptz,

  days_active_7d integer default 0,
  days_active_14d integer default 0,

  leads_created_total integer default 0,
  notes_created_total integer default 0,
  reminders_created_total integer default 0,
  reminders_completed_total integer default 0,

  searches_total integer default 0,
  route_searches_total integer default 0,
  saved_map_leads_total integer default 0,

  feedback_count integer default 0,
  upgrade_interest_count integer default 0,

  activation_completed boolean default false,
  core_loop_completed boolean default false,
  retention_signal boolean default false,
  monetization_signal boolean default false,

  recommended_action text,

  calculated_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_user_health_scores_score
on public.user_health_scores(health_score desc);

create index if not exists idx_user_health_scores_label
on public.user_health_scores(health_label);

create index if not exists idx_user_health_scores_action
on public.user_health_scores(recommended_action);

alter table public.user_health_scores enable row level security;

create table if not exists public.beta_cohorts (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,
  cohort_key text unique,

  target_user_count integer default 0,
  status text default 'planning',

  started_at timestamptz,
  ended_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_beta_cohorts_status
on public.beta_cohorts(status);

create table if not exists public.beta_cohort_members (
  id uuid primary key default gen_random_uuid(),

  cohort_id uuid not null references public.beta_cohorts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  beta_signup_id uuid references public.beta_signups(id) on delete set null,

  name text,
  email text,
  phone_zalo text,

  role_type text,
  industry text,
  persona_label text,

  invite_status text default 'not_invited',
  invited_at timestamptz,
  accepted_at timestamptz,
  onboarded_at timestamptz,

  interview_status text default 'not_scheduled',
  interview_at timestamptz,

  admin_note text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(cohort_id, user_id)
);

create index if not exists idx_beta_cohort_members_cohort
on public.beta_cohort_members(cohort_id);

create index if not exists idx_beta_cohort_members_user
on public.beta_cohort_members(user_id);

create index if not exists idx_beta_cohort_members_invite_status
on public.beta_cohort_members(invite_status);

create table if not exists public.in_app_surveys (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  survey_key text not null,
  rating integer,
  nps_score integer,

  most_useful_feature text,
  most_confusing_part text,
  would_continue_using text,
  willingness_to_pay text,
  open_feedback text,

  shown_at timestamptz,
  submitted_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, survey_key)
);

create index if not exists idx_in_app_surveys_user_key
on public.in_app_surveys(user_id, survey_key);

create index if not exists idx_in_app_surveys_submitted
on public.in_app_surveys(submitted_at desc);

alter table public.in_app_surveys enable row level security;

drop policy if exists "Users can insert own survey" on public.in_app_surveys;
create policy "Users can insert own survey"
on public.in_app_surveys for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can view own survey" on public.in_app_surveys;
create policy "Users can view own survey"
on public.in_app_surveys for select
using (auth.uid() = user_id);

drop policy if exists "Users can update own survey" on public.in_app_surveys;
create policy "Users can update own survey"
on public.in_app_surveys for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
