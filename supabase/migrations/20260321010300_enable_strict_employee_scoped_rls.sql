-- 启用严格员工隔离 RLS。
-- 依赖前置 migration：
-- 1. 20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql
-- 该 migration 会把 employees / production_orders / production_order_items
-- 从“authenticated 全量可用”切换到“管理员全量、员工仅本人”的模型。
create or replace function public.current_employee_id() returns uuid language sql stable security definer
set search_path = public as $$
select e.id
from public.employees e
where e.auth_user_id = auth.uid()
  and e.is_active = true
limit 1 $$;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
alter table public.employees enable row level security;
alter table public.production_orders enable row level security;
alter table public.production_order_items enable row level security;
drop policy if exists "Employees authenticated select" on public.employees;
drop policy if exists "Employees authenticated modify" on public.employees;
drop policy if exists "Employees admin all" on public.employees;
drop policy if exists "Employees self select" on public.employees;
create policy "Employees admin all" on public.employees for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Employees self select" on public.employees for
select to authenticated using (id = public.current_employee_id());
drop policy if exists "Production orders admin all" on public.production_orders;
drop policy if exists "Production orders employee select own" on public.production_orders;
drop policy if exists "Production orders employee insert own" on public.production_orders;
drop policy if exists "Production orders employee update own" on public.production_orders;
create policy "Production orders admin all" on public.production_orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Production orders employee select own" on public.production_orders for
select to authenticated using (employee_id = public.current_employee_id());
create policy "Production orders employee insert own" on public.production_orders for
insert to authenticated with check (employee_id = public.current_employee_id());
create policy "Production orders employee update own" on public.production_orders for
update to authenticated using (employee_id = public.current_employee_id()) with check (employee_id = public.current_employee_id());
drop policy if exists "Production order items admin all" on public.production_order_items;
drop policy if exists "Production order items employee select own" on public.production_order_items;
drop policy if exists "Production order items employee insert own" on public.production_order_items;
drop policy if exists "Production order items employee update own" on public.production_order_items;
drop policy if exists "Production order items employee delete own" on public.production_order_items;
create policy "Production order items admin all" on public.production_order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Production order items employee select own" on public.production_order_items for
select to authenticated using (
    exists (
      select 1
      from public.production_orders po
      where po.id = production_order_items.order_id
        and po.employee_id = public.current_employee_id()
    )
  );
create policy "Production order items employee insert own" on public.production_order_items for
insert to authenticated with check (
    exists (
      select 1
      from public.production_orders po
      where po.id = production_order_items.order_id
        and po.employee_id = public.current_employee_id()
    )
  );
create policy "Production order items employee update own" on public.production_order_items for
update to authenticated using (
    exists (
      select 1
      from public.production_orders po
      where po.id = production_order_items.order_id
        and po.employee_id = public.current_employee_id()
    )
  ) with check (
    exists (
      select 1
      from public.production_orders po
      where po.id = production_order_items.order_id
        and po.employee_id = public.current_employee_id()
    )
  );
create policy "Production order items employee delete own" on public.production_order_items for delete to authenticated using (
  exists (
    select 1
    from public.production_orders po
    where po.id = production_order_items.order_id
      and po.employee_id = public.current_employee_id()
  )
);