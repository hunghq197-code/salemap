begin;

alter table public.user_profiles
add column if not exists account_status text default 'active';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_account_status_check'
  ) then
    alter table public.user_profiles
    add constraint user_profiles_account_status_check
    check (account_status in ('active', 'suspended', 'deleted'));
  end if;
end $$;

create index if not exists idx_user_profiles_account_status
on public.user_profiles(account_status);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'support',
  is_active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  disabled_by uuid references auth.users(id) on delete set null,
  disabled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_users_role_check'
  ) then
    alter table public.admin_users
    add constraint admin_users_role_check
    check (role in ('super_admin', 'admin', 'support'));
  end if;
end $$;

create index if not exists idx_admin_users_user_id on public.admin_users(user_id);
create index if not exists idx_admin_users_role on public.admin_users(role);
create index if not exists idx_admin_users_active on public.admin_users(is_active);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  action text not null,
  target_type text,
  target_id text,
  severity text default 'info',
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_audit_logs_severity_check'
  ) then
    alter table public.admin_audit_logs
    add constraint admin_audit_logs_severity_check
    check (severity in ('info', 'warning', 'critical'));
  end if;
end $$;

create index if not exists idx_admin_audit_logs_actor
on public.admin_audit_logs(actor_user_id, created_at desc);
create index if not exists idx_admin_audit_logs_action
on public.admin_audit_logs(action);
create index if not exists idx_admin_audit_logs_target
on public.admin_audit_logs(target_type, target_id);
create index if not exists idx_admin_audit_logs_created_at
on public.admin_audit_logs(created_at desc);
create index if not exists idx_admin_audit_logs_severity
on public.admin_audit_logs(severity);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  severity text default 'info',
  route text,
  method text,
  ip_address text,
  user_agent text,
  message text,
  metadata jsonb default '{}'::jsonb,
  resolved boolean default false,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_security_events_user_id
on public.security_events(user_id, created_at desc);
create index if not exists idx_security_events_type
on public.security_events(event_type);
create index if not exists idx_security_events_severity
on public.security_events(severity);
create index if not exists idx_security_events_resolved
on public.security_events(resolved);
create index if not exists idx_security_events_created_at
on public.security_events(created_at desc);

create table if not exists public.user_quota_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_search_daily_limit integer,
  route_search_daily_limit integer,
  ai_daily_limit integer,
  export_daily_limit integer,
  import_monthly_limit integer,
  lead_limit integer,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_user_quota_overrides_user_id
on public.user_quota_overrides(user_id);

create table if not exists public.user_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enable_map_discovery boolean,
  enable_route_search boolean,
  enable_ai_assistant boolean,
  enable_export boolean,
  enable_import boolean,
  enable_cadences boolean,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists idx_user_feature_overrides_user_id
on public.user_feature_overrides(user_id);

create table if not exists public.support_access_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete cascade,
  access_type text not null,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_support_access_logs_actor
on public.support_access_logs(actor_user_id, created_at desc);
create index if not exists idx_support_access_logs_target
on public.support_access_logs(target_user_id, created_at desc);

alter table public.admin_users enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.security_events enable row level security;
alter table public.user_quota_overrides enable row level security;
alter table public.user_feature_overrides enable row level security;
alter table public.support_access_logs enable row level security;

create or replace function public.is_admin_user(
  required_roles text[] default array['super_admin','admin','support']
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
      and au.role = any(required_roles)
  );
$$;

drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
on public.admin_users for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Super admins can manage admin users" on public.admin_users;
create policy "Super admins can manage admin users"
on public.admin_users for all
using (public.is_admin_user(array['super_admin']))
with check (public.is_admin_user(array['super_admin']));

drop policy if exists "Admins can view audit logs" on public.admin_audit_logs;
create policy "Admins can view audit logs"
on public.admin_audit_logs for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can insert audit logs" on public.admin_audit_logs;
create policy "Admins can insert audit logs"
on public.admin_audit_logs for insert
with check (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can view security events" on public.security_events;
create policy "Admins can view security events"
on public.security_events for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can update security events" on public.security_events;
create policy "Admins can update security events"
on public.security_events for update
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view quota overrides" on public.user_quota_overrides;
create policy "Admins can view quota overrides"
on public.user_quota_overrides for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage quota overrides" on public.user_quota_overrides;
create policy "Admins can manage quota overrides"
on public.user_quota_overrides for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view feature overrides" on public.user_feature_overrides;
create policy "Admins can view feature overrides"
on public.user_feature_overrides for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage feature overrides" on public.user_feature_overrides;
create policy "Admins can manage feature overrides"
on public.user_feature_overrides for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view support access logs" on public.support_access_logs;
create policy "Admins can view support access logs"
on public.support_access_logs for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can insert support access logs" on public.support_access_logs;
create policy "Admins can insert support access logs"
on public.support_access_logs for insert
with check (public.is_admin_user(array['super_admin','admin','support']));

commit;
