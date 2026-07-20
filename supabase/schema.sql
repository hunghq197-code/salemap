create extension if not exists "pgcrypto";

create table if not exists beta_signups (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  phone_zalo text not null,
  email text,

  "current_role" text not null,
  industry text not null,
  main_area text not null,

  desired_features text[] not null default '{}',
  beta_readiness text not null,

  source text default 'landing_page',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,

  user_agent text,
  ip_address text,

  beta_score integer default 0,
  persona_label text,
  contact_status text default 'new',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_beta_signups_created_at
on beta_signups(created_at desc);

create index if not exists idx_beta_signups_phone_zalo
on beta_signups(phone_zalo);

create index if not exists idx_beta_signups_email
on beta_signups(email);

create index if not exists idx_beta_signups_current_role
on beta_signups("current_role");

create index if not exists idx_beta_signups_industry
on beta_signups(industry);

create index if not exists idx_beta_signups_contact_status
on beta_signups(contact_status);

alter table beta_signups enable row level security;
