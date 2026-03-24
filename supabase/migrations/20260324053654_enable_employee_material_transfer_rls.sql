alter table public.material_transfers enable row level security;
drop policy if exists "Material transfers employee select own" on public.material_transfers;
drop policy if exists "Material transfers employee insert own" on public.material_transfers;
drop policy if exists "Material transfers employee update own" on public.material_transfers;
create policy "Material transfers employee select own" on public.material_transfers for
select to authenticated using (
    operator_employee_id = public.current_employee_id()
  );
create policy "Material transfers employee insert own" on public.material_transfers for
insert to authenticated with check (
    operator_employee_id = public.current_employee_id()
    and coalesce(is_audited, false) = false
    and audited_at is null
  );
create policy "Material transfers employee update own" on public.material_transfers for
update to authenticated using (
    operator_employee_id = public.current_employee_id()
    and coalesce(is_audited, false) = false
  ) with check (
    operator_employee_id = public.current_employee_id()
    and coalesce(is_audited, false) = false
  );