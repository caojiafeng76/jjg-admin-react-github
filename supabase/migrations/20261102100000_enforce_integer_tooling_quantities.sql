-- 刀具数量统一为整数：入库数量、出库数量、库存数量只允许整数
-- 单价仍保留 2 位小数，不在本次约束范围内
-- final_stock 为生成列，由 current_stock + pending_stock_in - pending_stock_out 计算，自然为整数

alter table public.tooling_stock_in
  drop constraint if exists tooling_stock_in_quantity_integer;
alter table public.tooling_stock_in
  add constraint tooling_stock_in_quantity_integer
  check (stock_in_quantity = trunc(stock_in_quantity));

alter table public.tooling_stock_out
  drop constraint if exists tooling_stock_out_quantity_integer;
alter table public.tooling_stock_out
  add constraint tooling_stock_out_quantity_integer
  check (stock_out_quantity = trunc(stock_out_quantity));

alter table public.tooling_inventory
  drop constraint if exists tooling_inventory_current_stock_integer;
alter table public.tooling_inventory
  add constraint tooling_inventory_current_stock_integer
  check (current_stock = trunc(current_stock));

alter table public.tooling_inventory
  drop constraint if exists tooling_inventory_pending_stock_in_integer;
alter table public.tooling_inventory
  add constraint tooling_inventory_pending_stock_in_integer
  check (pending_stock_in = trunc(pending_stock_in));

alter table public.tooling_inventory
  drop constraint if exists tooling_inventory_pending_stock_out_integer;
alter table public.tooling_inventory
  add constraint tooling_inventory_pending_stock_out_integer
  check (pending_stock_out = trunc(pending_stock_out));
