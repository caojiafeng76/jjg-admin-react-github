-- Public labor-protection requisition registration is an open H5 workflow.
-- Machine number is optional in the form, so the public insert policy must not
-- reject rows where machine_equipment_id is null.

drop policy if exists "Labor protection requisitions public insert" on public.labor_protection_requisitions;
create policy "Labor protection requisitions public insert" on public.labor_protection_requisitions
for insert to anon, authenticated with check (
  labor_protection_data_id is not null
  and (
    machine_equipment_id is null
    or exists (
      select 1
      from public.machine_equipment_maintenances
      where id = machine_equipment_id
    )
  )
  and btrim(job_title) <> ''
  and quantity > 0
  and btrim(recipient) <> ''
  and collection_method in ('新领取', '以旧换新')
);
