create or replace function public.is_team_leader() returns boolean language sql stable security definer
set search_path = public as $$
select exists (
    select 1
    from public.employees e
    where e.auth_user_id = auth.uid()
      and e.role = 'team_leader'
      and e.is_active = true
  ) $$;
grant execute on function public.is_team_leader() to authenticated;
drop policy if exists "Employees team leader select all" on public.employees;
create policy "Employees team leader select all" on public.employees for
select to authenticated using (public.is_team_leader());
drop policy if exists "Material transfers employee select own" on public.material_transfers;
drop policy if exists "Material transfers employee insert own" on public.material_transfers;
drop policy if exists "Material transfers employee update own" on public.material_transfers;
create policy "Material transfers employee select own" on public.material_transfers for
select to authenticated using (
    public.is_team_leader()
    or operator_employee_id = public.current_employee_id()
  );
create policy "Material transfers employee insert own" on public.material_transfers for
insert to authenticated with check (
    (
      public.is_team_leader()
      or operator_employee_id = public.current_employee_id()
    )
    and coalesce(is_audited, false) = false
    and audited_at is null
  );
create policy "Material transfers employee update own" on public.material_transfers for
update to authenticated using (
    (
      public.is_team_leader()
      or operator_employee_id = public.current_employee_id()
    )
    and coalesce(is_audited, false) = false
  ) with check (
    (
      public.is_team_leader()
      or operator_employee_id = public.current_employee_id()
    )
    and coalesce(is_audited, false) = false
  );