create table if not exists public.production_daily_report_export_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by_admin_employee_id uuid not null references public.employees (id) on update cascade on delete restrict,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  request_payload jsonb not null default '{}'::jsonb,
  file_name text,
  file_path text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.production_daily_report_export_jobs is '生产日报导出任务';
comment on column public.production_daily_report_export_jobs.requested_by_admin_employee_id is '发起导出的管理员员工ID';
comment on column public.production_daily_report_export_jobs.request_payload is '导出请求参数快照';
comment on column public.production_daily_report_export_jobs.file_name is '导出文件名';
comment on column public.production_daily_report_export_jobs.file_path is '存储桶中的文件路径';
comment on column public.production_daily_report_export_jobs.error_message is '任务失败原因';
comment on column public.production_daily_report_export_jobs.expires_at is '导出文件过期时间';
create index if not exists idx_production_daily_report_export_jobs_created_at_desc on public.production_daily_report_export_jobs (created_at desc);
create index if not exists idx_production_daily_report_export_jobs_requester_created_at on public.production_daily_report_export_jobs (requested_by_admin_employee_id, created_at desc);
drop trigger if exists production_daily_report_export_jobs_set_updated_at on public.production_daily_report_export_jobs;
create trigger production_daily_report_export_jobs_set_updated_at before
update on public.production_daily_report_export_jobs for each row execute function public.update_updated_at_column();
alter table public.production_daily_report_export_jobs enable row level security;
drop policy if exists "Production daily report export jobs admin select own" on public.production_daily_report_export_jobs;
create policy "Production daily report export jobs admin select own" on public.production_daily_report_export_jobs for
select to authenticated using (
    public.is_admin()
    and requested_by_admin_employee_id = public.current_employee_id()
  );
insert into storage.buckets (id, name, public)
values (
    'production-daily-report-exports',
    'production-daily-report-exports',
    false
  ) on conflict (id) do nothing;