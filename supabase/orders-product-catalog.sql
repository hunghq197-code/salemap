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

create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null unique,
  category text not null,
  name text not null,
  description text,
  value_type text not null default 'quota',
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint features_category_check
    check (category in (
      'map',
      'leads',
      'tasks',
      'cadence',
      'import',
      'analytics',
      'ai',
      'support',
      'account'
    )),
  constraint features_value_type_check
    check (value_type in ('boolean', 'quota', 'capacity', 'duration'))
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  slug text not null unique,
  name text not null,
  description text,
  product_type text not null,
  is_active boolean not null default true,
  is_public boolean not null default true,
  display_order integer not null default 100,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_type_check
    check (product_type in (
      'base_plan',
      'recurring_addon',
      'quota_pack',
      'service_package'
    ))
);

create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  price_code text not null unique,
  currency text not null default 'VND',
  amount integer not null,
  billing_period text not null default 'one_time',
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  entitlement_template jsonb not null default '{}'::jsonb,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint product_prices_amount_check
    check (
      amount = 0 or amount >= 50000
    ),
  constraint product_prices_currency_check
    check (currency = 'VND'),
  constraint product_prices_period_check
    check (billing_period in ('one_time', 'monthly'))
);

create table if not exists public.product_features (
  product_id uuid not null references public.products(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (product_id, feature_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null default 'VND',
  subtotal_amount integer not null default 0,
  discount_amount integer not null default 0,
  total_amount integer not null default 0,
  status text not null default 'draft',
  payment_status text not null default 'pending',
  fulfillment_status text not null default 'unfulfilled',
  source text not null default 'user_addon',
  safe_metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  paid_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_currency_check check (currency = 'VND'),
  constraint orders_amount_check
    check (
      total_amount = 0 or total_amount >= 50000
    ),
  constraint orders_status_check
    check (status in (
      'draft',
      'pending_payment',
      'waiting_confirmation',
      'paid',
      'provisioning',
      'completed',
      'cancelled',
      'expired',
      'failed',
      'refunded'
    )),
  constraint orders_payment_status_check
    check (payment_status in (
      'pending',
      'waiting_confirmation',
      'paid',
      'cancelled',
      'expired',
      'failed',
      'refunded'
    )),
  constraint orders_fulfillment_status_check
    check (fulfillment_status in (
      'unfulfilled',
      'provisioning',
      'fulfilled',
      'failed'
    ))
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  price_id uuid references public.product_prices(id) on delete set null,
  product_type text not null,
  product_name_snapshot text not null,
  price_snapshot integer not null,
  quantity integer not null default 1,
  subtotal_amount integer not null,
  entitlement_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_amount_check check (price_snapshot >= 0 and subtotal_amount >= 0)
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  actor_admin_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.entitlement_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  source_type text not null,
  source_id uuid,
  grant_type text not null,
  feature_key text not null,
  amount integer,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active',
  idempotency_key text not null unique,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint entitlement_grants_source_check
    check (source_type in (
      'subscription',
      'addon_purchase',
      'admin_override',
      'promotion'
    )),
  constraint entitlement_grants_type_check
    check (grant_type in (
      'boolean_access',
      'quota',
      'capacity',
      'duration_access'
    )),
  constraint entitlement_grants_status_check
    check (status in ('active', 'expired', 'revoked')),
  constraint entitlement_grants_amount_check
    check (amount is null or amount >= 0)
);

alter table public.payments
add column if not exists order_id uuid references public.orders(id) on delete set null;

create index if not exists idx_products_public_active
on public.products(is_public, is_active, display_order);

create index if not exists idx_product_prices_product_active
on public.product_prices(product_id, is_active, starts_at desc);

create index if not exists idx_orders_user_created
on public.orders(user_id, created_at desc);

create index if not exists idx_orders_status_created
on public.orders(status, created_at desc);

create index if not exists idx_orders_payment_status_created
on public.orders(payment_status, created_at desc);

create index if not exists idx_order_items_order
on public.order_items(order_id);

create index if not exists idx_order_events_order
on public.order_events(order_id, created_at desc);

create index if not exists idx_entitlement_grants_user_feature
on public.entitlement_grants(user_id, feature_key, status, expires_at);

drop trigger if exists set_features_updated_at on public.features;
create trigger set_features_updated_at
before update on public.features
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.features enable row level security;
alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.product_features enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.entitlement_grants enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products for select
using (is_public = true and is_active = true);

drop policy if exists "Public can view active prices" on public.product_prices;
create policy "Public can view active prices"
on public.product_prices for select
using (
  is_active = true and exists (
    select 1 from public.products p
    where p.id = product_id
      and p.is_public = true
      and p.is_active = true
  )
);

drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
on public.orders for select
using (auth.uid() = user_id);

drop policy if exists "Users can view own order items" on public.order_items;
create policy "Users can view own order items"
on public.order_items for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Users can view own order events" on public.order_events;
create policy "Users can view own order events"
on public.order_events for select
using (
  exists (
    select 1 from public.orders o
    where o.id = order_id
      and o.user_id = auth.uid()
  )
);

drop policy if exists "Users can view own entitlement grants" on public.entitlement_grants;
create policy "Users can view own entitlement grants"
on public.entitlement_grants for select
using (auth.uid() = user_id);

drop policy if exists "Admins can manage catalog features" on public.features;
create policy "Admins can manage catalog features"
on public.features for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage product prices" on public.product_prices;
create policy "Admins can manage product prices"
on public.product_prices for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage product features" on public.product_features;
create policy "Admins can manage product features"
on public.product_features for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view orders" on public.orders;
create policy "Admins can view orders"
on public.orders for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
on public.orders for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view order items" on public.order_items;
create policy "Admins can view order items"
on public.order_items for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
on public.order_items for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view order events" on public.order_events;
create policy "Admins can view order events"
on public.order_events for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can insert order events" on public.order_events;
create policy "Admins can insert order events"
on public.order_events for insert
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view entitlement grants" on public.entitlement_grants;
create policy "Admins can view entitlement grants"
on public.entitlement_grants for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage entitlement grants" on public.entitlement_grants;
create policy "Admins can manage entitlement grants"
on public.entitlement_grants for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

insert into public.features (feature_key, category, name, value_type)
values
  ('map.near_me_search', 'map', 'Near-me map search', 'quota'),
  ('map.area_search', 'map', 'Area map search', 'quota'),
  ('map.route_search', 'map', 'Route search', 'quota'),
  ('leads.save_map_lead', 'leads', 'Saved map lead capacity', 'capacity'),
  ('import.rows', 'import', 'Import rows', 'quota'),
  ('ai.request', 'ai', 'AI requests', 'quota'),
  ('analytics.advanced', 'analytics', 'Advanced analytics', 'boolean'),
  ('support.priority', 'support', 'Priority support', 'duration')
on conflict (feature_key) do update
set
  category = excluded.category,
  name = excluded.name,
  value_type = excluded.value_type;

insert into public.products (product_code, slug, name, description, product_type, display_order)
values
  ('ADDON-MAP-S', 'map-search-pack-s', 'Map Search Pack S', 'Add-on quota for additional SaleMap discovery searches.', 'quota_pack', 10),
  ('ADDON-ROUTE-S', 'route-search-pack-s', 'Route Search Pack S', 'Add-on quota for more route search workflows.', 'quota_pack', 20),
  ('ADDON-AI-S', 'ai-assistant-pack-s', 'AI Assistant Pack S', 'Add-on quota for additional AI assistant requests.', 'quota_pack', 30),
  ('ADDON-ANALYTICS', 'advanced-analytics', 'Advanced Analytics', 'Recurring access to advanced analytics features.', 'recurring_addon', 40),
  ('ADDON-SUPPORT', 'priority-support', 'Priority Support', 'Recurring priority support access.', 'recurring_addon', 50)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  product_type = excluded.product_type,
  display_order = excluded.display_order,
  is_active = true,
  is_public = true;

insert into public.product_prices (
  product_id,
  price_code,
  amount,
  billing_period,
  entitlement_template
)
select p.id, v.price_code, v.amount, v.billing_period, v.entitlement_template::jsonb
from (
  values
    ('map-search-pack-s', 'PRICE-MAP-S-50000', 50000, 'one_time', '{"durationDays":30,"grants":[{"featureKey":"map.near_me_search","grantType":"quota","amount":50},{"featureKey":"map.area_search","grantType":"quota","amount":50}]}'),
    ('route-search-pack-s', 'PRICE-ROUTE-S-79000', 79000, 'one_time', '{"durationDays":30,"grants":[{"featureKey":"map.route_search","grantType":"quota","amount":20}]}'),
    ('ai-assistant-pack-s', 'PRICE-AI-S-50000', 50000, 'one_time', '{"durationDays":30,"grants":[{"featureKey":"ai.request","grantType":"quota","amount":50}]}'),
    ('advanced-analytics', 'PRICE-ANALYTICS-M-99000', 99000, 'monthly', '{"durationDays":30,"grants":[{"featureKey":"analytics.advanced","grantType":"boolean_access","amount":1}]}'),
    ('priority-support', 'PRICE-SUPPORT-M-99000', 99000, 'monthly', '{"durationDays":30,"grants":[{"featureKey":"support.priority","grantType":"duration_access","amount":1}]}')
) as v(slug, price_code, amount, billing_period, entitlement_template)
join public.products p on p.slug = v.slug
on conflict (price_code) do nothing;
