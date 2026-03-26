create table if not exists public.admin_management_passwords (
  employee_id uuid primary key references public.employees (id) on delete cascade,
  password_hash text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.admin_management_passwords is '管理员生产工单管理密码';
comment on column public.admin_management_passwords.employee_id is '管理员员工ID';
comment on column public.admin_management_passwords.password_hash is '管理密码哈希';

create index if not exists idx_admin_management_passwords_updated_at_desc
  on public.admin_management_passwords (updated_at desc);

alter table public.admin_management_passwords enable row level security;

drop trigger if exists update_admin_management_passwords_updated_at
  on public.admin_management_passwords;

create trigger update_admin_management_passwords_updated_at
before update on public.admin_management_passwords
for each row
execute function public.update_updated_at_column();