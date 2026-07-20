create table if not exists template_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references template_categories(id) on delete set null,
  title text not null,
  slug text unique,
  description text,
  content text not null,
  template_type text not null,
  situation text,
  industry text,
  channel text,
  is_public boolean default true,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_templates_category_id
on templates(category_id);

create index if not exists idx_templates_type
on templates(template_type);

create index if not exists idx_templates_channel
on templates(channel);

create index if not exists idx_templates_active_public
on templates(is_active, is_public);

create table if not exists template_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references templates(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, template_id)
);

create index if not exists idx_template_favorites_user_id
on template_favorites(user_id);

create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  export_type text not null default 'leads_csv',
  status text not null default 'completed',
  filters jsonb,
  selected_fields text[] default '{}',
  row_count integer default 0,
  created_at timestamptz default now()
);

create index if not exists idx_export_jobs_user_created_at
on export_jobs(user_id, created_at desc);

alter table template_categories enable row level security;
alter table templates enable row level security;
alter table template_favorites enable row level security;
alter table export_jobs enable row level security;

drop policy if exists "Template categories are readable" on template_categories;
create policy "Template categories are readable"
on template_categories for select
using (true);

drop policy if exists "Public active templates are readable" on templates;
create policy "Public active templates are readable"
on templates for select
using (is_public = true and is_active = true);

drop policy if exists "Users can view own template favorites" on template_favorites;
create policy "Users can view own template favorites"
on template_favorites for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own template favorites" on template_favorites;
create policy "Users can insert own template favorites"
on template_favorites for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own template favorites" on template_favorites;
create policy "Users can delete own template favorites"
on template_favorites for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own export jobs" on export_jobs;
create policy "Users can view own export jobs"
on export_jobs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own export jobs" on export_jobs;
create policy "Users can insert own export jobs"
on export_jobs for insert
with check (auth.uid() = user_id);
