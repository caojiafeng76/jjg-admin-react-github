-- Day 2 草稿：员工账号绑定字段改造
-- 说明：
-- 1. 这是设计稿级 SQL，不建议未经验证直接作为正式 migration 应用
-- 2. 当前按邮箱密码登录的 MVP 设计，只引入 auth_user_id / role / is_active
-- 3. mobile 字段本期不强制落地，避免在未确定手机号登录前提前固化字段
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
-- 可选初始化示例：
-- update public.employees
-- set role = 'admin'
-- where name = '管理员姓名';