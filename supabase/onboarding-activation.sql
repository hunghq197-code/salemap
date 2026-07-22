begin;

create table if not exists public.user_onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  role text,
  industry text,
  sales_model text,
  main_region text,
  primary_goal text,

  has_completed_onboarding boolean default false,
  completed_at timestamptz,
  skipped_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id)
);

create table if not exists public.user_activation_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  searched_map boolean default false,
  searched_map_at timestamptz,

  saved_first_lead boolean default false,
  saved_first_lead_at timestamptz,

  created_first_task boolean default false,
  created_first_task_at timestamptz,

  applied_first_cadence boolean default false,
  applied_first_cadence_at timestamptz,

  completed_first_task boolean default false,
  completed_first_task_at timestamptz,

  imported_leads boolean default false,
  imported_leads_at timestamptz,

  viewed_dashboard boolean default false,
  viewed_dashboard_at timestamptz,

  activation_score integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id)
);

create table if not exists public.onboarding_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  rating integer,
  difficulty text,
  message text,
  source text default 'onboarding',

  created_at timestamptz default now()
);

alter table public.leads
add column if not exists is_demo boolean default false;

alter table public.reminders
add column if not exists is_demo boolean default false;

alter table public.lead_notes
add column if not exists is_demo boolean default false;

do $$
begin
  if to_regclass('public.lead_cadences') is not null then
    execute 'alter table public.lead_cadences add column if not exists is_demo boolean default false';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_onboarding_profiles_role_check'
  ) then
    alter table public.user_onboarding_profiles
    add constraint user_onboarding_profiles_role_check
    check (role is null or role in ('field_sales', 'b2b_sales', 'distributor', 'business_owner', 'freelancer', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_onboarding_profiles_industry_check'
  ) then
    alter table public.user_onboarding_profiles
    add constraint user_onboarding_profiles_industry_check
    check (industry is null or industry in ('fmcg', 'pharma', 'building_materials', 'equipment', 'services', 'real_estate', 'education', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_onboarding_profiles_sales_model_check'
  ) then
    alter table public.user_onboarding_profiles
    add constraint user_onboarding_profiles_sales_model_check
    check (sales_model is null or sales_model in ('field_visit', 'phone_zalo', 'mixed', 'online_first'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'user_onboarding_profiles_primary_goal_check'
  ) then
    alter table public.user_onboarding_profiles
    add constraint user_onboarding_profiles_primary_goal_check
    check (primary_goal is null or primary_goal in ('find_new_customers', 'manage_followups', 'organize_leads', 'track_sales_pipeline', 'test_product'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'onboarding_feedback_rating_check'
  ) then
    alter table public.onboarding_feedback
    add constraint onboarding_feedback_rating_check
    check (rating is null or (rating >= 1 and rating <= 5));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'onboarding_feedback_difficulty_check'
  ) then
    alter table public.onboarding_feedback
    add constraint onboarding_feedback_difficulty_check
    check (difficulty is null or difficulty in ('easy', 'normal', 'hard', 'confusing'));
  end if;
end $$;

create index if not exists idx_user_onboarding_profiles_user_id
on public.user_onboarding_profiles(user_id);

create index if not exists idx_user_activation_progress_user_id
on public.user_activation_progress(user_id);

create index if not exists idx_user_activation_progress_score
on public.user_activation_progress(activation_score);

create index if not exists idx_onboarding_feedback_user_id
on public.onboarding_feedback(user_id, created_at desc);

create index if not exists idx_leads_user_demo
on public.leads(user_id, is_demo);

create index if not exists idx_reminders_user_demo
on public.reminders(user_id, is_demo);

create index if not exists idx_lead_notes_user_demo
on public.lead_notes(user_id, is_demo);

do $$
begin
  if to_regclass('public.lead_cadences') is not null then
    execute 'create index if not exists idx_lead_cadences_user_demo on public.lead_cadences(user_id, is_demo)';
  end if;
end $$;

alter table public.user_onboarding_profiles enable row level security;
alter table public.user_activation_progress enable row level security;
alter table public.onboarding_feedback enable row level security;

drop policy if exists "Users can view own onboarding profile" on public.user_onboarding_profiles;
create policy "Users can view own onboarding profile"
on public.user_onboarding_profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own onboarding profile" on public.user_onboarding_profiles;
create policy "Users can insert own onboarding profile"
on public.user_onboarding_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own onboarding profile" on public.user_onboarding_profiles;
create policy "Users can update own onboarding profile"
on public.user_onboarding_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own activation progress" on public.user_activation_progress;
create policy "Users can view own activation progress"
on public.user_activation_progress for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own activation progress" on public.user_activation_progress;
create policy "Users can insert own activation progress"
on public.user_activation_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own activation progress" on public.user_activation_progress;
create policy "Users can update own activation progress"
on public.user_activation_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can insert own onboarding feedback" on public.onboarding_feedback;
create policy "Users can insert own onboarding feedback"
on public.onboarding_feedback for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can view own onboarding feedback" on public.onboarding_feedback;
create policy "Users can view own onboarding feedback"
on public.onboarding_feedback for select
using (auth.uid() = user_id);

commit;
