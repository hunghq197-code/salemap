begin;

create index if not exists idx_leads_perf_user_created_at
on leads(user_id, created_at desc);

create index if not exists idx_leads_perf_user_updated_at
on leads(user_id, updated_at desc);

create index if not exists idx_leads_perf_user_status
on leads(user_id, status);

create index if not exists idx_leads_perf_user_source
on leads(user_id, source);

create index if not exists idx_leads_perf_user_next_follow_up_at
on leads(user_id, next_follow_up_at);

create index if not exists idx_leads_perf_user_deleted_at
on leads(user_id, deleted_at);

create index if not exists idx_leads_perf_user_is_archived
on leads(user_id, is_archived);

create index if not exists idx_leads_perf_user_archived_at
on leads(user_id, archived_at desc);

create index if not exists idx_leads_perf_user_place_id
on leads(user_id, place_id);

create index if not exists idx_reminders_perf_user_remind_at
on reminders(user_id, remind_at);

create index if not exists idx_reminders_perf_user_status
on reminders(user_id, status);

create index if not exists idx_reminders_perf_user_lead_id
on reminders(user_id, lead_id);

create index if not exists idx_reminders_perf_user_completed_at
on reminders(user_id, completed_at);

create index if not exists idx_lead_notes_perf_user_lead_created
on lead_notes(user_id, lead_id, created_at desc);

create index if not exists idx_tags_perf_user_name
on tags(user_id, name);

create index if not exists idx_lead_tags_perf_lead_id
on lead_tags(lead_id);

create index if not exists idx_lead_tags_perf_tag_id
on lead_tags(tag_id);

create index if not exists idx_map_searches_perf_user_created_at
on map_searches(user_id, created_at desc);

create index if not exists idx_routes_perf_user_created_at
on routes(user_id, created_at desc);

create index if not exists idx_import_jobs_perf_user_created_at
on import_jobs(user_id, created_at desc);

create index if not exists idx_import_rows_perf_job_status
on import_rows(import_job_id, status);

create index if not exists idx_lead_pipeline_events_perf_user_created_at
on lead_pipeline_events(user_id, created_at desc);

create index if not exists idx_lead_pipeline_events_perf_lead_id
on lead_pipeline_events(lead_id);

create index if not exists idx_sales_activity_daily_perf_user_activity_date
on sales_activity_daily(user_id, activity_date desc);

commit;
