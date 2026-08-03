create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.customer_admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  customer_code text not null unique default (
    'CUS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  email_cache text,
  full_name_cache text,
  lifecycle text not null default 'registered',
  lifecycle_overridden_by uuid references auth.users(id) on delete set null,
  lifecycle_overridden_at timestamptz,
  lifecycle_override_reason text,
  assigned_owner_admin_id uuid references auth.users(id) on delete set null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_admin_profiles_lifecycle_check
    check (lifecycle in (
      'registered',
      'activated',
      'trial',
      'paying',
      'at_risk',
      'churned',
      'suspended'
    ))
);

create table if not exists public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  color_token text not null default 'slate',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_tags_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint customer_tags_color_token_check
    check (color_token in (
      'slate',
      'blue',
      'green',
      'yellow',
      'red',
      'purple'
    ))
);

create table if not exists public.customer_tag_assignments (
  tag_id uuid not null references public.customer_tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (tag_id, user_id)
);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_admin_id uuid references auth.users(id) on delete set null,
  content text not null,
  visibility text not null default 'internal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint customer_notes_visibility_check
    check (visibility = 'internal'),
  constraint customer_notes_content_length_check
    check (char_length(content) between 1 and 3000)
);

create table if not exists public.customer_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_admin_id uuid references auth.users(id) on delete set null,
  event_type text not null default 'lifecycle_changed',
  from_lifecycle text,
  to_lifecycle text not null,
  reason text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint customer_lifecycle_events_to_check
    check (to_lifecycle in (
      'registered',
      'activated',
      'trial',
      'paying',
      'at_risk',
      'churned',
      'suspended'
    )),
  constraint customer_lifecycle_events_from_check
    check (
      from_lifecycle is null or
      from_lifecycle in (
        'registered',
        'activated',
        'trial',
        'paying',
        'at_risk',
        'churned',
        'suspended'
      )
    )
);

create index if not exists idx_customer_admin_profiles_lifecycle
on public.customer_admin_profiles(lifecycle, updated_at desc);

create index if not exists idx_customer_admin_profiles_email
on public.customer_admin_profiles(lower(email_cache));

create index if not exists idx_customer_admin_profiles_owner
on public.customer_admin_profiles(assigned_owner_admin_id, updated_at desc);

create index if not exists idx_customer_tags_slug
on public.customer_tags(slug);

create index if not exists idx_customer_tag_assignments_user
on public.customer_tag_assignments(user_id, created_at desc);

create index if not exists idx_customer_notes_user
on public.customer_notes(user_id, created_at desc)
where deleted_at is null;

create index if not exists idx_customer_lifecycle_events_user
on public.customer_lifecycle_events(user_id, created_at desc);

drop trigger if exists set_customer_admin_profiles_updated_at on public.customer_admin_profiles;
create trigger set_customer_admin_profiles_updated_at
before update on public.customer_admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_customer_tags_updated_at on public.customer_tags;
create trigger set_customer_tags_updated_at
before update on public.customer_tags
for each row execute function public.set_updated_at();

drop trigger if exists set_customer_notes_updated_at on public.customer_notes;
create trigger set_customer_notes_updated_at
before update on public.customer_notes
for each row execute function public.set_updated_at();

alter table public.customer_admin_profiles enable row level security;
alter table public.customer_tags enable row level security;
alter table public.customer_tag_assignments enable row level security;
alter table public.customer_notes enable row level security;
alter table public.customer_lifecycle_events enable row level security;

drop policy if exists "Admins can view customer admin profiles" on public.customer_admin_profiles;
create policy "Admins can view customer admin profiles"
on public.customer_admin_profiles for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage customer admin profiles" on public.customer_admin_profiles;
create policy "Admins can manage customer admin profiles"
on public.customer_admin_profiles for all
using (public.is_admin_user(array['super_admin','admin','support']))
with check (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can view customer tags" on public.customer_tags;
create policy "Admins can view customer tags"
on public.customer_tags for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage customer tags" on public.customer_tags;
create policy "Admins can manage customer tags"
on public.customer_tags for all
using (public.is_admin_user(array['super_admin','admin','support']))
with check (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can view customer tag assignments" on public.customer_tag_assignments;
create policy "Admins can view customer tag assignments"
on public.customer_tag_assignments for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage customer tag assignments" on public.customer_tag_assignments;
create policy "Admins can manage customer tag assignments"
on public.customer_tag_assignments for all
using (public.is_admin_user(array['super_admin','admin','support']))
with check (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can view customer notes" on public.customer_notes;
create policy "Admins can view customer notes"
on public.customer_notes for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage customer notes" on public.customer_notes;
create policy "Admins can manage customer notes"
on public.customer_notes for all
using (public.is_admin_user(array['super_admin','admin','support']))
with check (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can view customer lifecycle events" on public.customer_lifecycle_events;
create policy "Admins can view customer lifecycle events"
on public.customer_lifecycle_events for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can insert customer lifecycle events" on public.customer_lifecycle_events;
create policy "Admins can insert customer lifecycle events"
on public.customer_lifecycle_events for insert
with check (public.is_admin_user(array['super_admin','admin','support']));
