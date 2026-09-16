-- Public tooling stock-out H5 registration is an open workflow that does not
-- require login. The form offers a "无机器" (no machine) option, so the public
-- insert policy must accept null machine_equipment_id (validating the value
-- against machine_equipment_maintenances only when one is provided).

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
);;
