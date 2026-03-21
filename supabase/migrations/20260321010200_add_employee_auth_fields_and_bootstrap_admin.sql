-- 为 employees 表增加账号绑定与角色字段，并将指定邮箱提升为管理员。
-- 本次 migration 采用最小影响原则：
-- 1. 只补齐员工权限相关字段和管理员初始化数据
-- 2. 不在本 migration 中切换现有宽松 RLS，避免影响当前功能使用
alter table public.employees
add column if not exists auth_user_id uuid;
alter table public.employees
add column if not exists role text not null default 'employee';
alter table public.employees
add column if not exists is_active boolean not null default true;
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'employees_role_check'
    and conrelid = 'public.employees'::regclass
) then
alter table public.employees
add constraint employees_role_check check (role in ('admin', 'employee'));
end if;
end $$;
create unique index if not exists idx_employees_auth_user_id_unique on public.employees (auth_user_id)
where auth_user_id is not null;
create index if not exists idx_employees_role on public.employees (role);
create index if not exists idx_employees_is_active on public.employees (is_active);
comment on column public.employees.auth_user_id is '绑定 Supabase Auth 用户 ID';
comment on column public.employees.role is '角色：admin / employee';
comment on column public.employees.is_active is '员工账号是否启用';
create or replace function public.is_admin() returns boolean language sql stable security definer
set search_path = public as $$
select exists (
    select 1
    from public.employees e
    where e.auth_user_id = auth.uid()
      and e.role = 'admin'
      and e.is_active = true
  ) $$;
grant execute on function public.is_admin() to authenticated;
do $$
declare target_user_id uuid;
target_employee_id uuid;
begin
select u.id into target_user_id
from auth.users u
where lower(u.email) = lower('cjf811651172@gmail.com')
order by u.created_at asc
limit 1;
if target_user_id is null then raise notice 'Auth user cjf811651172@gmail.com not found, skipping admin bootstrap.';
return;
end if;
select e.id into target_employee_id
from public.employees e
where e.auth_user_id = target_user_id
limit 1;
if target_employee_id is not null then
update public.employees
set role = 'admin',
  is_active = true
where id = target_employee_id;
raise notice 'Existing employee binding promoted to admin for cjf811651172@gmail.com.';
return;
end if;
select e.id into target_employee_id
from public.employees e
where e.name = '系统管理员'
limit 1;
if target_employee_id is not null then
update public.employees
set auth_user_id = target_user_id,
  role = 'admin',
  is_active = true
where id = target_employee_id;
raise notice 'System administrator employee row bound to cjf811651172@gmail.com.';
return;
end if;
insert into public.employees (name, auth_user_id, role, is_active)
values ('系统管理员', target_user_id, 'admin', true);
raise notice 'Inserted system administrator employee row for cjf811651172@gmail.com.';
end $$;