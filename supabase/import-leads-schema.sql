create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size_bytes integer,
  status text not null default 'uploaded',
  total_rows integer default 0,
  valid_rows integer default 0,
  invalid_rows integer default 0,
  duplicate_rows integer default 0,
  imported_rows integer default 0,
  skipped_rows integer default 0,
  updated_rows integer default 0,
  failed_rows integer default 0,
  duplicate_strategy text default 'skip',
  field_mapping jsonb,
  error_summary jsonb,
  sample_rows jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_import_jobs_user_created_at
on import_jobs(user_id, created_at desc);

create index if not exists idx_import_jobs_status
on import_jobs(status);

alter table import_jobs enable row level security;

drop policy if exists "Users can view own import jobs" on import_jobs;
create policy "Users can view own import jobs"
on import_jobs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own import jobs" on import_jobs;
create policy "Users can insert own import jobs"
on import_jobs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own import jobs" on import_jobs;
create policy "Users can update own import jobs"
on import_jobs for update
using (auth.uid() = user_id);

create table if not exists import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references import_jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  row_index integer not null,
  raw_data jsonb not null,
  mapped_data jsonb,
  status text not null default 'pending',
  validation_errors jsonb,
  duplicate_lead_id uuid references leads(id) on delete set null,
  imported_lead_id uuid references leads(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_import_rows_job_id on import_rows(import_job_id);
create index if not exists idx_import_rows_user_id on import_rows(user_id);
create index if not exists idx_import_rows_status on import_rows(status);
create index if not exists idx_import_rows_duplicate_lead_id on import_rows(duplicate_lead_id);

alter table import_rows enable row level security;

drop policy if exists "Users can view own import rows" on import_rows;
create policy "Users can view own import rows"
on import_rows for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own import rows" on import_rows;
create policy "Users can insert own import rows"
on import_rows for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own import rows" on import_rows;
create policy "Users can update own import rows"
on import_rows for update
using (auth.uid() = user_id);
