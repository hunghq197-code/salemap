create table if not exists routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_text text not null,
  destination_text text not null,
  origin_lat numeric,
  origin_lng numeric,
  destination_lat numeric,
  destination_lng numeric,
  route_polyline text,
  distance_meters integer,
  duration_seconds integer,
  search_keyword text,
  buffer_meters integer default 1000,
  provider text default 'google_maps',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create index if not exists idx_routes_user_created_at
on routes(user_id, created_at desc);

create index if not exists idx_routes_search_keyword
on routes(search_keyword);

alter table routes enable row level security;

drop policy if exists "Users can view own routes" on routes;
create policy "Users can view own routes"
on routes for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own routes" on routes;
create policy "Users can insert own routes"
on routes for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own routes" on routes;
create policy "Users can update own routes"
on routes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own routes" on routes;
create policy "Users can delete own routes"
on routes for delete
using (auth.uid() = user_id);

create table if not exists route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references routes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  place_id text,
  name text not null,
  address text,
  phone text,
  website text,
  category text,
  latitude numeric,
  longitude numeric,
  rating numeric,
  user_ratings_total integer,
  google_maps_url text,
  distance_from_route_meters integer,
  distance_from_origin_meters integer,
  order_index integer,
  is_saved_as_lead boolean default false,
  raw_place_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_route_stops_route_id
on route_stops(route_id);

create index if not exists idx_route_stops_user_id
on route_stops(user_id);

create index if not exists idx_route_stops_place_id
on route_stops(place_id);

create index if not exists idx_route_stops_distance_from_route
on route_stops(distance_from_route_meters);

alter table route_stops enable row level security;

drop policy if exists "Users can view own route stops" on route_stops;
create policy "Users can view own route stops"
on route_stops for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own route stops" on route_stops;
create policy "Users can insert own route stops"
on route_stops for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own route stops" on route_stops;
create policy "Users can update own route stops"
on route_stops for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own route stops" on route_stops;
create policy "Users can delete own route stops"
on route_stops for delete
using (auth.uid() = user_id);
