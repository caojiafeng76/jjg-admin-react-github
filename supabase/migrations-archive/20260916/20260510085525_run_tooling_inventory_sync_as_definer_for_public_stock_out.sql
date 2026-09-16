-- Public tooling stock-out inserts are allowed, but their inventory sync trigger
-- must update tooling_inventory internally without granting public clients direct
-- write access to the inventory table.

alter function public.ensure_tooling_inventory_row(uuid, text, text, text, text, numeric)
  security definer
  set search_path = public;

alter function public.refresh_tooling_inventory_pending_stock_out(uuid)
  security definer
  set search_path = public;

alter function public.apply_tooling_stock_out_audit(uuid, numeric)
  security definer
  set search_path = public;

alter function public.handle_tooling_stock_out_inventory_sync()
  security definer
  set search_path = public;

drop policy if exists "Tooling data public select" on public.tooling_data;
create policy "Tooling data public select" on public.tooling_data
for select to anon, authenticated using (true);
