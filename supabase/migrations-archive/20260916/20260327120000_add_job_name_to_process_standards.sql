alter table public.process_standards
add column if not exists job_name text;
comment on column public.process_standards.job_name is '工种，关联岗位基础数值设定';
create index if not exists idx_process_standards_job_name on public.process_standards (job_name);
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'process_standards_job_name_fkey'
    and conrelid = 'public.process_standards'::regclass
) then
alter table public.process_standards
add constraint process_standards_job_name_fkey foreign key (job_name) references public.job_base_settings (job_name) on update cascade on delete restrict;
end if;
end $$;
with mapped_jobs as (
  select id,
    case
      when operation ilike '%cnc%' then 'CNC'
      when operation like '%滚弯%' then '滚弯'
      when operation like '%折弯%' then '折弯'
      when operation like '%切割%' then '切割'
      when operation like '自动切%' then '切割'
      when operation like '%割机%' then '切割'
      when operation like '%组装%' then '组装'
      when operation like '%攻丝%' then '攻丝'
      when operation like '冲%'
      or operation like '%打孔%' then '冲床'
      else null
    end as job_name
  from public.process_standards
)
update public.process_standards as process_standards
set job_name = mapped_jobs.job_name
from mapped_jobs
where process_standards.id = mapped_jobs.id
  and process_standards.job_name is null
  and mapped_jobs.job_name is not null;
update public.process_standards as process_standards
set labor_rate = job_base_settings.hourly_fee
from public.job_base_settings as job_base_settings
where process_standards.job_name = job_base_settings.job_name
  and coalesce(process_standards.labor_rate, 0) = 0
  and job_base_settings.hourly_fee is not null;