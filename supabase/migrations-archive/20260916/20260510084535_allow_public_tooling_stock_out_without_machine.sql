-- Public tooling stock-out registration is an open H5 workflow.
-- Machine number is optional in the form, so the public insert policy must not
-- reject rows where machine_equipment_id is null.

drop policy if exists "Machine equipment maintenances public select" on public.machine_equipment_maintenances;
create policy "Machine equipment maintenances public select" on public.machine_equipment_maintenances
for select to anon, authenticated using (true);

drop policy if exists "Tooling stock out public insert" on public.tooling_stock_out;
create policy "Tooling stock out public insert" on public.tooling_stock_out
for insert to anon, authenticated with check (
  tooling_data_id is not null
  and (
    machine_equipment_id is null
    or exists (
      select 1
      from public.machine_equipment_maintenances
      where id = machine_equipment_id
    )
  )
  and btrim(tool_code) <> ''
  and btrim(tool_name) <> ''
  and btrim(tool_spec) <> ''
  and btrim(material) <> ''
  and btrim(recipient) <> ''
  and btrim(purpose) <> ''
  and unit_price >= 0
  and stock_out_quantity > 0
  and status = '待审核'
  and collection_method in ('新领取', '以旧换新')
);
