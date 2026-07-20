alter table leads
add column if not exists place_id text,
add column if not exists google_maps_url text,
add column if not exists external_source text,
add column if not exists rating numeric,
add column if not exists user_ratings_total integer,
add column if not exists opening_hours jsonb,
add column if not exists raw_place_data jsonb;

create index if not exists idx_leads_place_id
on leads(place_id);

create unique index if not exists uniq_user_place_active
on leads(user_id, place_id)
where place_id is not null and deleted_at is null;

create table if not exists map_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  search_type text not null,
  keyword text not null,
  area_text text,
  radius_meters integer,
  center_lat numeric,
  center_lng numeric,
  result_count integer default 0,
  provider text default 'google_maps',
  quota_consumed integer default 1,
  created_at timestamptz default now()
);

create index if not exists idx_map_searches_user_created_at
on map_searches(user_id, created_at desc);

create index if not exists idx_map_searches_search_type
on map_searches(search_type);

alter table map_searches enable row level security;

drop policy if exists "Users can view own map searches" on map_searches;
create policy "Users can view own map searches"
on map_searches for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own map searches" on map_searches;
create policy "Users can insert own map searches"
on map_searches for insert
with check (auth.uid() = user_id);

create table if not exists daily_usage_limits (
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
on daily_usage_limits(user_id, usage_date desc);

alter table daily_usage_limits enable row level security;

drop policy if exists "Users can view own daily usage" on daily_usage_limits;
create policy "Users can view own daily usage"
on daily_usage_limits for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own daily usage" on daily_usage_limits;
create policy "Users can insert own daily usage"
on daily_usage_limits for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own daily usage" on daily_usage_limits;
create policy "Users can update own daily usage"
on daily_usage_limits for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
