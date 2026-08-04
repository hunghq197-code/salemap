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

create table if not exists public.support_ticket_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  default_priority text not null default 'normal',
  sla_first_response_minutes integer not null default 1440,
  sla_resolution_minutes integer not null default 4320,
  is_active boolean not null default true,
  display_order integer not null default 100,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_ticket_categories_priority_check
    check (default_priority in ('low', 'normal', 'high', 'urgent')),
  constraint support_ticket_categories_sla_check
    check (sla_first_response_minutes > 0 and sla_resolution_minutes > 0)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.support_ticket_categories(id) on delete set null,
  subject text not null,
  description text not null,
  status text not null default 'new',
  priority text not null default 'normal',
  assigned_admin_id uuid references auth.users(id) on delete set null,
  source text not null default 'user_portal',
  first_response_due_at timestamptz,
  resolution_due_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  cancelled_at timestamptz,
  last_user_reply_at timestamptz,
  last_admin_reply_at timestamptz,
  last_message_at timestamptz,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_subject_length_check
    check (char_length(subject) between 3 and 160),
  constraint support_tickets_description_length_check
    check (char_length(description) between 10 and 4000),
  constraint support_tickets_status_check
    check (status in (
      'new',
      'open',
      'waiting_on_customer',
      'waiting_on_support',
      'resolved',
      'closed',
      'cancelled'
    )),
  constraint support_tickets_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent'))
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  author_admin_id uuid references auth.users(id) on delete set null,
  author_type text not null,
  body text not null,
  visibility text not null default 'public',
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint support_ticket_messages_author_type_check
    check (author_type in ('user', 'admin', 'system')),
  constraint support_ticket_messages_visibility_check
    check (visibility in ('public', 'internal')),
  constraint support_ticket_messages_body_length_check
    check (char_length(body) between 1 and 5000),
  constraint support_ticket_messages_author_check
    check (
      (author_type = 'user' and author_user_id is not null and author_admin_id is null)
      or (author_type = 'admin' and author_admin_id is not null)
      or (author_type = 'system')
    )
);

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_admin_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_ticket_categories_active
on public.support_ticket_categories(is_active, display_order);

create index if not exists idx_support_tickets_user_created
on public.support_tickets(user_id, created_at desc);

create index if not exists idx_support_tickets_queue
on public.support_tickets(status, priority, first_response_due_at, created_at desc);

create index if not exists idx_support_tickets_assignee
on public.support_tickets(assigned_admin_id, status, updated_at desc);

create index if not exists idx_support_ticket_messages_ticket
on public.support_ticket_messages(ticket_id, created_at);

create index if not exists idx_support_ticket_events_ticket
on public.support_ticket_events(ticket_id, created_at desc);

drop trigger if exists set_support_ticket_categories_updated_at on public.support_ticket_categories;
create trigger set_support_ticket_categories_updated_at
before update on public.support_ticket_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

alter table public.support_ticket_categories enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.support_ticket_events enable row level security;

drop policy if exists "Users can view active support categories" on public.support_ticket_categories;
create policy "Users can view active support categories"
on public.support_ticket_categories for select
using (is_active = true);

drop policy if exists "Admins can manage support categories" on public.support_ticket_categories;
create policy "Admins can manage support categories"
on public.support_ticket_categories for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Users can view own support tickets" on public.support_tickets;
create policy "Users can view own support tickets"
on public.support_tickets for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own support tickets" on public.support_tickets;
create policy "Users can create own support tickets"
on public.support_tickets for insert
with check (auth.uid() = user_id);

drop policy if exists "Admins can view support tickets" on public.support_tickets;
create policy "Admins can view support tickets"
on public.support_tickets for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage support tickets" on public.support_tickets;
create policy "Admins can manage support tickets"
on public.support_tickets for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Users can view public messages on own tickets" on public.support_ticket_messages;
create policy "Users can view public messages on own tickets"
on public.support_ticket_messages for select
using (
  visibility = 'public'
  and exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "Users can create public messages on own tickets" on public.support_ticket_messages;
create policy "Users can create public messages on own tickets"
on public.support_ticket_messages for insert
with check (
  visibility = 'public'
  and author_type = 'user'
  and author_user_id = auth.uid()
  and exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "Admins can view support ticket messages" on public.support_ticket_messages;
create policy "Admins can view support ticket messages"
on public.support_ticket_messages for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can manage support ticket messages" on public.support_ticket_messages;
create policy "Admins can manage support ticket messages"
on public.support_ticket_messages for all
using (public.is_admin_user(array['super_admin','admin']))
with check (public.is_admin_user(array['super_admin','admin']));

drop policy if exists "Users can view own support ticket events" on public.support_ticket_events;
create policy "Users can view own support ticket events"
on public.support_ticket_events for select
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "Admins can view support ticket events" on public.support_ticket_events;
create policy "Admins can view support ticket events"
on public.support_ticket_events for select
using (public.is_admin_user(array['super_admin','admin','support']));

drop policy if exists "Admins can insert support ticket events" on public.support_ticket_events;
create policy "Admins can insert support ticket events"
on public.support_ticket_events for insert
with check (public.is_admin_user(array['super_admin','admin']));

insert into public.support_ticket_categories (
  slug,
  name,
  description,
  default_priority,
  sla_first_response_minutes,
  sla_resolution_minutes,
  display_order
)
values
  ('account', 'Tài khoản', 'Đăng nhập, hồ sơ, trạng thái tài khoản.', 'normal', 1440, 4320, 10),
  ('billing', 'Thanh toán', 'Gói dịch vụ, hóa đơn, chuyển khoản, payOS.', 'high', 720, 2880, 20),
  ('bug', 'Lỗi sản phẩm', 'Lỗi khi dùng SaleMap hoặc dữ liệu hiển thị bất thường.', 'high', 720, 2880, 30),
  ('how_to', 'Hướng dẫn sử dụng', 'Cần hướng dẫn thao tác hoặc thiết lập.', 'normal', 1440, 4320, 40),
  ('feature_request', 'Đề xuất tính năng', 'Ý tưởng hoặc nhu cầu tính năng mới.', 'low', 2880, 10080, 50)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  default_priority = excluded.default_priority,
  sla_first_response_minutes = excluded.sla_first_response_minutes,
  sla_resolution_minutes = excluded.sla_resolution_minutes,
  display_order = excluded.display_order,
  is_active = true;
