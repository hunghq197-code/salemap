create table if not exists beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feedback_type text not null,
  rating integer,
  title text,
  content text not null,
  page_path text,
  browser_info text,
  device_type text,
  status text default 'new',
  priority text default 'normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_beta_feedback_user_id
on beta_feedback(user_id);

create index if not exists idx_beta_feedback_created_at
on beta_feedback(created_at desc);

create index if not exists idx_beta_feedback_status
on beta_feedback(status);

create index if not exists idx_beta_feedback_type
on beta_feedback(feedback_type);

alter table beta_feedback enable row level security;

drop policy if exists "Users can insert own beta feedback" on beta_feedback;
create policy "Users can insert own beta feedback"
on beta_feedback for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can view own beta feedback" on beta_feedback;
create policy "Users can view own beta feedback"
on beta_feedback for select
using (auth.uid() = user_id);

create table if not exists beta_checklist_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checklist_key text not null,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, checklist_key)
);

alter table beta_checklist_progress enable row level security;

drop policy if exists "Users can view own checklist progress" on beta_checklist_progress;
create policy "Users can view own checklist progress"
on beta_checklist_progress for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own checklist progress" on beta_checklist_progress;
create policy "Users can insert own checklist progress"
on beta_checklist_progress for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own checklist progress" on beta_checklist_progress;
create policy "Users can update own checklist progress"
on beta_checklist_progress for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
