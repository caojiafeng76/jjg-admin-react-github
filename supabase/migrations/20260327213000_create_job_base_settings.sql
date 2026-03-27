create table if not exists public.job_base_settings (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  standard_income numeric(12, 2) not null default 0,
  daily_work_hours numeric(6, 2) not null default 11,
  working_days integer not null default 28,
  monthly_standard_hours numeric(10, 2) generated always as (
    (daily_work_hours * working_days::numeric)::numeric(10, 2)
  ) stored,
  hourly_fee numeric(14, 8) generated always as (
    case
      when (daily_work_hours * working_days::numeric) > 0::numeric then
        (standard_income / (daily_work_hours * working_days::numeric))::numeric(14, 8)
      else 0::numeric(14, 8)
    end
  ) stored,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint job_base_settings_job_name_not_blank check (btrim(job_name) <> ''),
  constraint job_base_settings_standard_income_non_negative check (standard_income >= 0::numeric),
  constraint job_base_settings_daily_work_hours_positive check (daily_work_hours > 0::numeric),
  constraint job_base_settings_working_days_positive check (working_days > 0)
);

comment on table public.job_base_settings is '岗位基础数值设定';
comment on column public.job_base_settings.job_name is '工种';
comment on column public.job_base_settings.standard_income is '标准收入，单位：元';
comment on column public.job_base_settings.hourly_fee is '工时费，单位：元/小时，由标准收入除以月标准工作时间自动生成';
comment on column public.job_base_settings.daily_work_hours is '每日工作时间，单位：小时';
comment on column public.job_base_settings.working_days is '工作天数，单位：天';
comment on column public.job_base_settings.monthly_standard_hours is '月标准工作时间，单位：小时，由每日工作时间乘以工作天数自动生成';

create unique index if not exists idx_job_base_settings_job_name_unique
  on public.job_base_settings (job_name);

create index if not exists idx_job_base_settings_updated_at_desc
  on public.job_base_settings (updated_at desc);

drop trigger if exists update_job_base_settings_updated_at on public.job_base_settings;
create trigger update_job_base_settings_updated_at
before update on public.job_base_settings
for each row execute function public.update_updated_at_column();

alter table public.job_base_settings enable row level security;

drop policy if exists "Job base settings admin all" on public.job_base_settings;
create policy "Job base settings admin all"
on public.job_base_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
