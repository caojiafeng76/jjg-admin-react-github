do $$ begin if exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'employees'
    and column_name = 'performance'
)
and not exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'employees'
    and column_name = 'coefficient'
) then
alter table public.employees
  rename column performance to coefficient;
end if;
end $$;
alter table public.employees
add column if not exists coefficient numeric(6, 2);
alter table public.employees
add column if not exists job_name text;
update public.employees
set coefficient = coalesce(coefficient, 1.0)
where coefficient is null;
alter table public.employees
alter column coefficient
set default 1.0;
alter table public.employees
alter column coefficient
set not null;
comment on column public.employees.coefficient is '系数';
comment on column public.employees.job_name is '工种，引用岗位基础数值设定';
comment on column public.employees.hourly_wage is '岗位时薪，由岗位基础数值设定中的工时费自动同步';
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'employees_job_name_fkey'
    and conrelid = 'public.employees'::regclass
) then
alter table public.employees
add constraint employees_job_name_fkey foreign key (job_name) references public.job_base_settings (job_name) on update cascade on delete restrict;
end if;
end $$;
create index if not exists idx_employees_job_name on public.employees (job_name);
create or replace function public.apply_job_base_hourly_fee_to_employee() returns trigger language plpgsql as $$
declare matched_hourly_fee numeric(12, 2);
begin if new.job_name is null then new.hourly_wage = round(coalesce(new.hourly_wage, 0)::numeric, 2);
return new;
end if;
select round(coalesce(jbs.hourly_fee, 0)::numeric, 2) into matched_hourly_fee
from public.job_base_settings as jbs
where jbs.job_name = new.job_name
limit 1;
if matched_hourly_fee is null then return new;
end if;
new.hourly_wage = matched_hourly_fee;
return new;
end;
$$;
drop trigger if exists apply_job_base_hourly_fee_to_employee on public.employees;
create trigger apply_job_base_hourly_fee_to_employee before
insert
  or
update of job_name,
  hourly_wage on public.employees for each row execute function public.apply_job_base_hourly_fee_to_employee();
create or replace function public.sync_employee_hourly_wage_from_job_base_setting() returns trigger language plpgsql as $$
declare target_hourly_fee numeric(12, 2);
begin target_hourly_fee = round(coalesce(new.hourly_fee, 0)::numeric, 2);
update public.employees as e
set hourly_wage = target_hourly_fee
where (
    e.job_name = new.job_name
    or (
      tg_op = 'UPDATE'
      and e.job_name = old.job_name
    )
  )
  and e.hourly_wage is distinct
from target_hourly_fee;
return new;
end;
$$;
drop trigger if exists sync_employee_hourly_wage_from_job_base_setting on public.job_base_settings;
create trigger sync_employee_hourly_wage_from_job_base_setting
after
insert
  or
update on public.job_base_settings for each row execute function public.sync_employee_hourly_wage_from_job_base_setting();
update public.employees as e
set hourly_wage = round(coalesce(jbs.hourly_fee, 0)::numeric, 2)
from public.job_base_settings as jbs
where e.job_name = jbs.job_name
  and e.hourly_wage is distinct
from round(coalesce(jbs.hourly_fee, 0)::numeric, 2);