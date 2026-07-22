begin;

create table if not exists cadence_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text default 'general',
  is_system boolean default false,
  is_active boolean default true,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cadence_steps (
  id uuid primary key default gen_random_uuid(),
  cadence_template_id uuid not null references cadence_templates(id) on delete cascade,
  step_order integer not null,
  day_offset integer not null default 0,
  task_type text not null default 'follow_up',
  title text not null,
  suggested_message text,
  suggested_note text,
  priority text default 'medium',
  suggested_lead_status text,
  is_required boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lead_cadences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  cadence_template_id uuid not null references cadence_templates(id) on delete restrict,
  status text not null default 'active',
  started_at timestamptz default now(),
  paused_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  current_step_order integer default 1,
  total_steps integer default 0,
  completed_steps integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cadence_task_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_cadence_id uuid not null references lead_cadences(id) on delete cascade,
  cadence_step_id uuid not null references cadence_steps(id) on delete cascade,
  reminder_id uuid not null references reminders(id) on delete cascade,
  step_order integer not null,
  created_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cadence_steps_step_order_positive'
  ) then
    alter table cadence_steps
    add constraint cadence_steps_step_order_positive check (step_order >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cadence_steps_day_offset_non_negative'
  ) then
    alter table cadence_steps
    add constraint cadence_steps_day_offset_non_negative check (day_offset >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'lead_cadences_progress_non_negative'
  ) then
    alter table lead_cadences
    add constraint lead_cadences_progress_non_negative
    check (total_steps >= 0 and completed_steps >= 0 and current_step_order >= 1);
  end if;
end $$;

drop index if exists idx_one_active_cadence_per_lead;
create unique index idx_one_active_cadence_per_lead
on lead_cadences(user_id, lead_id)
where status in ('active', 'paused');

create unique index if not exists idx_cadence_steps_template_step_order_unique
on cadence_steps(cadence_template_id, step_order);

create index if not exists idx_cadence_templates_user_id on cadence_templates(user_id);
create index if not exists idx_cadence_templates_is_system on cadence_templates(is_system);
create index if not exists idx_cadence_templates_active on cadence_templates(is_active, is_archived);
create index if not exists idx_cadence_templates_category on cadence_templates(category);

create index if not exists idx_cadence_steps_template_order
on cadence_steps(cadence_template_id, step_order);

create index if not exists idx_lead_cadences_user_id on lead_cadences(user_id);
create index if not exists idx_lead_cadences_lead_id on lead_cadences(lead_id);
create index if not exists idx_lead_cadences_status on lead_cadences(user_id, status);
create index if not exists idx_lead_cadences_started_at
on lead_cadences(user_id, started_at desc);

create index if not exists idx_cadence_task_links_user_id on cadence_task_links(user_id);
create index if not exists idx_cadence_task_links_lead_cadence_id
on cadence_task_links(lead_cadence_id);
create index if not exists idx_cadence_task_links_reminder_id
on cadence_task_links(reminder_id);
create index if not exists idx_cadence_task_links_step_id
on cadence_task_links(cadence_step_id);

alter table cadence_templates enable row level security;
alter table cadence_steps enable row level security;
alter table lead_cadences enable row level security;
alter table cadence_task_links enable row level security;

drop policy if exists "Users can view system and own cadence templates" on cadence_templates;
create policy "Users can view system and own cadence templates"
on cadence_templates for select
using (is_system = true or auth.uid() = user_id);

drop policy if exists "Users can create own cadence templates" on cadence_templates;
create policy "Users can create own cadence templates"
on cadence_templates for insert
with check (auth.uid() = user_id and is_system = false);

drop policy if exists "Users can update own cadence templates" on cadence_templates;
create policy "Users can update own cadence templates"
on cadence_templates for update
using (auth.uid() = user_id and is_system = false)
with check (auth.uid() = user_id and is_system = false);

drop policy if exists "Users can delete own cadence templates" on cadence_templates;
create policy "Users can delete own cadence templates"
on cadence_templates for delete
using (auth.uid() = user_id and is_system = false);

drop policy if exists "Users can view cadence steps" on cadence_steps;
create policy "Users can view cadence steps"
on cadence_steps for select
using (
  exists (
    select 1
    from cadence_templates ct
    where ct.id = cadence_steps.cadence_template_id
      and (ct.is_system = true or ct.user_id = auth.uid())
  )
);

drop policy if exists "Users can insert own cadence steps" on cadence_steps;
create policy "Users can insert own cadence steps"
on cadence_steps for insert
with check (
  exists (
    select 1
    from cadence_templates ct
    where ct.id = cadence_steps.cadence_template_id
      and ct.user_id = auth.uid()
      and ct.is_system = false
  )
);

drop policy if exists "Users can update own cadence steps" on cadence_steps;
create policy "Users can update own cadence steps"
on cadence_steps for update
using (
  exists (
    select 1
    from cadence_templates ct
    where ct.id = cadence_steps.cadence_template_id
      and ct.user_id = auth.uid()
      and ct.is_system = false
  )
)
with check (
  exists (
    select 1
    from cadence_templates ct
    where ct.id = cadence_steps.cadence_template_id
      and ct.user_id = auth.uid()
      and ct.is_system = false
  )
);

drop policy if exists "Users can delete own cadence steps" on cadence_steps;
create policy "Users can delete own cadence steps"
on cadence_steps for delete
using (
  exists (
    select 1
    from cadence_templates ct
    where ct.id = cadence_steps.cadence_template_id
      and ct.user_id = auth.uid()
      and ct.is_system = false
  )
);

drop policy if exists "Users can view own lead cadences" on lead_cadences;
create policy "Users can view own lead cadences"
on lead_cadences for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own lead cadences" on lead_cadences;
create policy "Users can insert own lead cadences"
on lead_cadences for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own lead cadences" on lead_cadences;
create policy "Users can update own lead cadences"
on lead_cadences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lead cadences" on lead_cadences;
create policy "Users can delete own lead cadences"
on lead_cadences for delete
using (auth.uid() = user_id);

drop policy if exists "Users can view own cadence task links" on cadence_task_links;
create policy "Users can view own cadence task links"
on cadence_task_links for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own cadence task links" on cadence_task_links;
create policy "Users can insert own cadence task links"
on cadence_task_links for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cadence task links" on cadence_task_links;
create policy "Users can delete own cadence task links"
on cadence_task_links for delete
using (auth.uid() = user_id);

commit;
