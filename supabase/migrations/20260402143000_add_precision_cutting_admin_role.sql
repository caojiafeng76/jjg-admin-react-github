alter table public.employees drop constraint if exists employees_role_check;
alter table public.employees
add constraint employees_role_check check (
    role in ('admin', 'employee', 'team_leader', 'precision_cutting_admin')
  );

comment on column public.employees.role is
  '角色：admin / employee / team_leader / precision_cutting_admin';

create or replace function public.is_precision_cutting_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
select exists (
    select 1
    from public.employees e
    where e.auth_user_id = auth.uid()
      and e.role = 'precision_cutting_admin'
      and e.is_active = true
  )
$$;

grant execute on function public.is_precision_cutting_admin() to authenticated;

drop policy if exists "Precision cutting transfers admin all"
  on public.precision_cutting_transfers;

create policy "Precision cutting transfers admin and precision admin all"
on public.precision_cutting_transfers
for all
to authenticated
using (public.is_admin() or public.is_precision_cutting_admin())
with check (public.is_admin() or public.is_precision_cutting_admin());