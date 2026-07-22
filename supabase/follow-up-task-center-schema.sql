alter table reminders
add column if not exists task_type text default 'follow_up',
add column if not exists priority text default 'medium',
add column if not exists completed_note_id uuid references lead_notes(id) on delete set null,
add column if not exists snoozed_from timestamptz,
add column if not exists snooze_count integer default 0,
add column if not exists cancelled_at timestamptz;

update reminders
set task_type = coalesce(task_type, 'follow_up'),
    priority = coalesce(priority, 'medium'),
    status = case when status = 'done' then 'completed' else coalesce(status, 'pending') end
where task_type is null
   or priority is null
   or status is null
   or status = 'done';

create index if not exists idx_reminders_user_status_remind_at
on reminders(user_id, status, remind_at);

create index if not exists idx_reminders_user_lead_status
on reminders(user_id, lead_id, status);

create index if not exists idx_reminders_user_completed_at
on reminders(user_id, completed_at desc);

create index if not exists idx_reminders_task_type
on reminders(task_type);

create index if not exists idx_reminders_priority
on reminders(priority);

create table if not exists task_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_id uuid references reminders(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,

  event_type text not null,
  from_status text,
  to_status text,

  metadata jsonb,

  created_at timestamptz default now()
);

create index if not exists idx_task_events_user_created_at
on task_events(user_id, created_at desc);

create index if not exists idx_task_events_reminder_id
on task_events(reminder_id);

create index if not exists idx_task_events_lead_id
on task_events(lead_id);

create index if not exists idx_task_events_event_type
on task_events(event_type);

alter table task_events enable row level security;

drop policy if exists "Users can view own task events" on task_events;
create policy "Users can view own task events"
on task_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own task events" on task_events;
create policy "Users can insert own task events"
on task_events for insert
with check (auth.uid() = user_id);
