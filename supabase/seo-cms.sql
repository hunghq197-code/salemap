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

create table if not exists public.cms_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  parent_id uuid references public.cms_categories(id) on delete set null,
  seo_title text,
  seo_description text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_categories_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.cms_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_tags_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.cms_media (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  storage_bucket text,
  storage_path text,
  public_url text,
  mime_type text not null,
  size_bytes bigint,
  alt_text text,
  caption text,
  status text not null default 'active',
  uploaded_by uuid references auth.users(id) on delete set null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_media_status_check
    check (status in ('active', 'archived')),
  constraint cms_media_mime_check
    check (
      mime_type in (
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
      )
    )
);

create table if not exists public.cms_posts (
  id uuid primary key default gen_random_uuid(),
  content_type text not null default 'post',
  slug text not null,
  title text not null,
  excerpt text,
  content_text text not null default '',
  status text not null default 'draft',
  author_admin_id uuid references auth.users(id) on delete set null,
  primary_category_id uuid references public.cms_categories(id) on delete set null,
  featured_media_id uuid references public.cms_media(id) on delete set null,
  featured_image_url text,
  featured_image_alt text,
  seo_title text,
  seo_description text,
  og_title text,
  og_description text,
  og_image_url text,
  canonical_path text,
  schema_type text not null default 'Article',
  noindex boolean not null default false,
  scheduled_at timestamptz,
  published_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  revision_number integer not null default 1,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_posts_content_type_check
    check (content_type in ('post', 'page')),
  constraint cms_posts_status_check
    check (status in ('draft', 'review', 'scheduled', 'published', 'archived')),
  constraint cms_posts_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint cms_posts_title_length_check
    check (char_length(title) between 3 and 180),
  constraint cms_posts_canonical_path_check
    check (canonical_path is null or canonical_path ~ '^/[a-z0-9][a-z0-9/_-]*$'),
  constraint cms_posts_unique_slug_per_type
    unique (content_type, slug)
);

create table if not exists public.cms_post_tags (
  post_id uuid not null references public.cms_posts(id) on delete cascade,
  tag_id uuid not null references public.cms_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create table if not exists public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.cms_posts(id) on delete cascade,
  revision_number integer not null,
  title text not null,
  excerpt text,
  content_text text not null default '',
  status text not null,
  seo_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint cms_revisions_unique_number
    unique (post_id, revision_number)
);

create table if not exists public.cms_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  destination_path text not null,
  status_code integer not null default 301,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_redirects_source_check
    check (source_path ~ '^/[a-z0-9][a-z0-9/_-]*$'),
  constraint cms_redirects_destination_check
    check (destination_path ~ '^/[a-z0-9][a-z0-9/_-]*$'),
  constraint cms_redirects_status_code_check
    check (status_code in (301, 302)),
  constraint cms_redirects_no_loop_check
    check (source_path <> destination_path)
);

create table if not exists public.cms_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.cms_posts(id) on delete cascade,
  actor_admin_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cms_posts_public
on public.cms_posts(content_type, status, published_at desc);

create index if not exists idx_cms_posts_admin
on public.cms_posts(content_type, status, updated_at desc);

create index if not exists idx_cms_post_tags_tag
on public.cms_post_tags(tag_id, post_id);

create index if not exists idx_cms_redirects_source_active
on public.cms_redirects(source_path, is_active);

drop trigger if exists set_cms_categories_updated_at on public.cms_categories;
create trigger set_cms_categories_updated_at
before update on public.cms_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_tags_updated_at on public.cms_tags;
create trigger set_cms_tags_updated_at
before update on public.cms_tags
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_media_updated_at on public.cms_media;
create trigger set_cms_media_updated_at
before update on public.cms_media
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_posts_updated_at on public.cms_posts;
create trigger set_cms_posts_updated_at
before update on public.cms_posts
for each row execute function public.set_updated_at();

drop trigger if exists set_cms_redirects_updated_at on public.cms_redirects;
create trigger set_cms_redirects_updated_at
before update on public.cms_redirects
for each row execute function public.set_updated_at();

alter table public.cms_categories enable row level security;
alter table public.cms_tags enable row level security;
alter table public.cms_media enable row level security;
alter table public.cms_posts enable row level security;
alter table public.cms_post_tags enable row level security;
alter table public.cms_revisions enable row level security;
alter table public.cms_redirects enable row level security;
alter table public.cms_events enable row level security;

drop policy if exists "Public can view active cms categories" on public.cms_categories;
create policy "Public can view active cms categories"
on public.cms_categories for select
using (is_active = true);

drop policy if exists "Public can view active cms tags" on public.cms_tags;
create policy "Public can view active cms tags"
on public.cms_tags for select
using (is_active = true);

drop policy if exists "Public can view published cms posts" on public.cms_posts;
create policy "Public can view published cms posts"
on public.cms_posts for select
using (
  status = 'published'
  and noindex = false
  and published_at is not null
  and published_at <= now()
);

drop policy if exists "Public can view active cms redirects" on public.cms_redirects;
create policy "Public can view active cms redirects"
on public.cms_redirects for select
using (is_active = true);

drop policy if exists "Admins can manage cms categories" on public.cms_categories;
create policy "Admins can manage cms categories"
on public.cms_categories for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage cms tags" on public.cms_tags;
create policy "Admins can manage cms tags"
on public.cms_tags for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage cms media" on public.cms_media;
create policy "Admins can manage cms media"
on public.cms_media for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage cms posts" on public.cms_posts;
create policy "Admins can manage cms posts"
on public.cms_posts for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage cms post tags" on public.cms_post_tags;
create policy "Admins can manage cms post tags"
on public.cms_post_tags for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view cms revisions" on public.cms_revisions;
create policy "Admins can view cms revisions"
on public.cms_revisions for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can insert cms revisions" on public.cms_revisions;
create policy "Admins can insert cms revisions"
on public.cms_revisions for insert
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can manage cms redirects" on public.cms_redirects;
create policy "Admins can manage cms redirects"
on public.cms_redirects for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can view cms events" on public.cms_events;
create policy "Admins can view cms events"
on public.cms_events for select
using (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Admins can insert cms events" on public.cms_events;
create policy "Admins can insert cms events"
on public.cms_events for insert
with check (public.is_admin_user(array['super_admin','admin']));

insert into public.cms_categories (slug, name, description)
values
  ('huong-dan-sales', 'Hướng dẫn sales', 'Bài viết hướng dẫn quy trình sales và follow-up.'),
  ('ban-do-khach-hang', 'Bản đồ khách hàng', 'Nội dung về tìm kiếm khách hàng theo khu vực và tuyến đường.'),
  ('quan-ly-lead', 'Quản lý lead', 'Nội dung về lưu lead, pipeline, task và chăm sóc khách hàng.')
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_active = true;
