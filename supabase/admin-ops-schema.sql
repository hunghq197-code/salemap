alter table public.user_profiles
add column if not exists is_admin boolean default false;

create index if not exists idx_user_profiles_is_admin
on public.user_profiles(is_admin);

update public.user_profiles
set is_admin = false
where is_admin is null;

alter table public.user_profiles
alter column is_admin set default false;

-- These admin_note columns are added only when the feature tables already exist.
-- Run supabase/beta-testing-schema.sql to create beta_feedback.
-- Run supabase/billing-upgrade-interest-schema.sql to create upgrade_interests.
alter table if exists public.beta_feedback
add column if not exists admin_note text;

alter table if exists public.beta_signups
add column if not exists admin_note text;

alter table if exists public.upgrade_interests
add column if not exists admin_note text;

-- After running the schema above, promote your founder/test account:
-- update public.user_profiles
-- set is_admin = true
-- where user_id = (
--   select id from auth.users where lower(email) = lower('your-email@example.com')
-- );
