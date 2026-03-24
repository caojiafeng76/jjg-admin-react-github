alter table public.employees
drop constraint if exists employees_role_check;

alter table public.employees
add constraint employees_role_check check (
  role in ('admin', 'employee', 'team_leader')
);

comment on column public.employees.role is '角色：admin / employee / team_leader';