alter table public.employees
add column if not exists is_external boolean;

update public.employees
set is_external = false
where is_external is null;

alter table public.employees
alter column is_external
set default false;

alter table public.employees
alter column is_external
set not null;

comment on column public.employees.is_external is '是否外来员工';
