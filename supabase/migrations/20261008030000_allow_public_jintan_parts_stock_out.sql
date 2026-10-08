-- 金坛配件出库公开 H5 扫码登记：免登录可查库存下拉、可新增出库流水。
-- 对齐刀具出库公开模式（Tooling data public select / Tooling stock out public insert）。
-- 权限模型：anon 仅 SELECT 库存 + INSERT 出库流水；出库的库存扣减与快照由
-- security definer 触发器 handle_jintan_parts_stock_out() 在属主权限下完成，
-- 不直接给 anon 开库存写权限；prevent_viewer_dml 对 anon（auth.uid() 为空）直接放行。

grant select on public.jintan_parts_inventory to anon, authenticated;
grant insert on public.jintan_parts_stock_out to anon, authenticated;

drop policy if exists "Jintan parts inventory public select" on public.jintan_parts_inventory;
create policy "Jintan parts inventory public select" on public.jintan_parts_inventory
for select to anon, authenticated using (true);

drop policy if exists "Jintan parts stock out public insert" on public.jintan_parts_stock_out;
create policy "Jintan parts stock out public insert" on public.jintan_parts_stock_out
for insert to anon, authenticated with check (
  inventory_id is not null
  and quantity > 0
  and char_length(btrim(coalesce(remarks, ''))) <= 500
);
