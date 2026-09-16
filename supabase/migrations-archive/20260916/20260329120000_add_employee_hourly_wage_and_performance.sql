alter table public.employees
add column if not exists hourly_wage numeric(12, 2);
alter table public.employees
add column if not exists performance numeric(6, 2);
update public.employees
set hourly_wage = coalesce(hourly_wage, 0),
  performance = coalesce(performance, 1.0)
where hourly_wage is null
  or performance is null;
alter table public.employees
alter column hourly_wage
set default 0;
alter table public.employees
alter column hourly_wage
set not null;
alter table public.employees
alter column performance
set default 1.0;
alter table public.employees
alter column performance
set not null;
comment on column public.employees.hourly_wage is '岗位时薪';
comment on column public.employees.performance is '绩效系数';