-- Public H5 tooling stock-out pages should work whether the browser has an
-- existing Supabase session or is completely anonymous.

drop policy if exists "Tooling data public select" on public.tooling_data;
create policy "Tooling data public select" on public.tooling_data
for select to anon, authenticated using (true);

drop policy if exists "Tooling stock out public insert" on public.tooling_stock_out;
create policy "Tooling stock out public insert" on public.tooling_stock_out
for insert to anon, authenticated with check (
  tooling_data_id is not null
  and machine_equipment_id is not null
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
