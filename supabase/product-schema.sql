create extension if not exists pgcrypto;

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  full_name text,
  role_type text,
  industry text,
  primary_city text,
  primary_district text,
  goals text[] default '{}',

  onboarding_completed boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  phone text,
  email text,
  website text,
  address text,

  source text default 'manual',
  status text default 'new',
  priority text default 'medium',

  category text,
  note_summary text,

  latitude numeric,
  longitude numeric,

  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,

  is_archived boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,

  interaction_type text default 'other',
  outcome text default 'other',
  content text not null,

  status_before text,
  status_after text,

  contacted_at timestamptz default now(),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,

  title text not null,
  description text,
  remind_at timestamptz not null,

  status text default 'pending',
  completed_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  color text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(user_id, name)
);

create table if not exists lead_tags (
  lead_id uuid not null references leads(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz default now(),

  primary key (lead_id, tag_id)
);

create index if not exists user_profiles_user_id_idx on user_profiles(user_id);
create index if not exists leads_user_id_created_at_idx on leads(user_id, created_at desc);
create index if not exists leads_user_id_next_follow_up_idx on leads(user_id, next_follow_up_at);
create index if not exists lead_notes_user_id_lead_id_idx on lead_notes(user_id, lead_id);
create index if not exists reminders_user_id_remind_at_idx on reminders(user_id, remind_at);
create index if not exists tags_user_id_name_idx on tags(user_id, name);

alter table user_profiles enable row level security;
alter table leads enable row level security;
alter table lead_notes enable row level security;
alter table reminders enable row level security;
alter table tags enable row level security;
alter table lead_tags enable row level security;

drop policy if exists "Users can view own profile" on user_profiles;
create policy "Users can view own profile"
on user_profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on user_profiles;
create policy "Users can insert own profile"
on user_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on user_profiles;
create policy "Users can update own profile"
on user_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own profile" on user_profiles;
create policy "Users can delete own profile"
on user_profiles for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own leads" on leads;
create policy "Users can view own leads"
on leads for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own leads" on leads;
create policy "Users can insert own leads"
on leads for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own leads" on leads;
create policy "Users can update own leads"
on leads for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own leads" on leads;
create policy "Users can delete own leads"
on leads for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own lead notes" on lead_notes;
create policy "Users can view own lead notes"
on lead_notes for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lead notes" on lead_notes;
create policy "Users can insert own lead notes"
on lead_notes for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from leads
    where leads.id = lead_notes.lead_id
      and leads.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own lead notes" on lead_notes;
create policy "Users can update own lead notes"
on lead_notes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lead notes" on lead_notes;
create policy "Users can delete own lead notes"
on lead_notes for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own reminders" on reminders;
create policy "Users can view own reminders"
on reminders for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own reminders" on reminders;
create policy "Users can insert own reminders"
on reminders for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own reminders" on reminders;
create policy "Users can update own reminders"
on reminders for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reminders" on reminders;
create policy "Users can delete own reminders"
on reminders for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own tags" on tags;
create policy "Users can view own tags"
on tags for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own tags" on tags;
create policy "Users can insert own tags"
on tags for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own tags" on tags;
create policy "Users can update own tags"
on tags for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tags" on tags;
create policy "Users can delete own tags"
on tags for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own lead tags" on lead_tags;
create policy "Users can view own lead tags"
on lead_tags for select
using (
  exists (
    select 1 from leads
    where leads.id = lead_tags.lead_id
      and leads.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own lead tags" on lead_tags;
create policy "Users can insert own lead tags"
on lead_tags for insert
with check (
  exists (
    select 1 from leads
    where leads.id = lead_tags.lead_id
      and leads.user_id = auth.uid()
  )
  and exists (
    select 1 from tags
    where tags.id = lead_tags.tag_id
      and tags.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own lead tags" on lead_tags;
create policy "Users can delete own lead tags"
on lead_tags for delete
using (
  exists (
    select 1 from leads
    where leads.id = lead_tags.lead_id
      and leads.user_id = auth.uid()
  )
);
