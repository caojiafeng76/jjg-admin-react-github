create table if not exists public.packaging_employees (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  name text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint packaging_employees_username_not_blank check (btrim(username) <> ''),
  constraint packaging_employees_name_not_blank check (btrim(name) <> '')
);
comment on table public.packaging_employees is '包装工序员工';
comment on column public.packaging_employees.username is '用户名';
comment on column public.packaging_employees.name is '姓名';
create unique index if not exists idx_packaging_employees_username_unique on public.packaging_employees (username);
create index if not exists idx_packaging_employees_updated_at_desc on public.packaging_employees (updated_at desc);
drop trigger if exists update_packaging_employees_updated_at on public.packaging_employees;
create trigger update_packaging_employees_updated_at before update on public.packaging_employees for each row execute function public.update_updated_at_column();
alter table public.packaging_employees enable row level security;
drop policy if exists "Packaging employees admin all" on public.packaging_employees;
create policy "Packaging employees admin all" on public.packaging_employees for all to authenticated using (public.is_admin()) with check (public.is_admin());;
