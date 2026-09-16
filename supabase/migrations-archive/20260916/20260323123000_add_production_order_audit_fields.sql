alter table public.production_orders
add column if not exists is_audited boolean not null default false,
  add column if not exists audited_at timestamptz;
comment on column public.production_orders.is_audited is '生产工单是否已审核';
comment on column public.production_orders.audited_at is '生产工单审核时间';
create or replace function public.sync_production_order_audit_fields() returns trigger language plpgsql as $$ begin if new.is_audited is true then if tg_op = 'INSERT' then new.audited_at = coalesce(new.audited_at, now());
elsif old.is_audited is distinct
from new.is_audited then new.audited_at = coalesce(new.audited_at, now());
end if;
else new.audited_at = null;
end if;
return new;
end;
$$;
drop trigger if exists sync_production_order_audit_fields on public.production_orders;
create trigger sync_production_order_audit_fields before
insert
  or
update of is_audited,
  audited_at on public.production_orders for each row execute function public.sync_production_order_audit_fields();
drop policy if exists "Production orders employee update own" on public.production_orders;
create policy "Production orders employee update own" on public.production_orders for
update to authenticated using (
    employee_id = public.current_employee_id()
    and coalesce(is_audited, false) = false
  ) with check (
    employee_id = public.current_employee_id()
    and coalesce(is_audited, false) = false
  );
drop policy if exists "Production order items employee insert own" on public.production_order_items;
drop policy if exists "Production order items employee update own" on public.production_order_items;
drop policy if exists "Production order items employee delete own" on public.production_order_items;
create policy "Production order items employee insert own" on public.production_order_items for
insert to authenticated with check (
    exists (
      select 1
      from public.production_orders po
      where po.id = production_order_items.order_id
        and po.employee_id = public.current_employee_id()
        and coalesce(po.is_audited, false) = false
    )
  );
create policy "Production order items employee update own" on public.production_order_items for
update to authenticated using (
    exists (
      select 1
      from public.production_orders po
      where po.id = production_order_items.order_id
        and po.employee_id = public.current_employee_id()
        and coalesce(po.is_audited, false) = false
    )
  ) with check (
    exists (
      select 1
      from public.production_orders po
      where po.id = production_order_items.order_id
        and po.employee_id = public.current_employee_id()
        and coalesce(po.is_audited, false) = false
    )
  );
create policy "Production order items employee delete own" on public.production_order_items for delete to authenticated using (
  exists (
    select 1
    from public.production_orders po
    where po.id = production_order_items.order_id
      and po.employee_id = public.current_employee_id()
      and coalesce(po.is_audited, false) = false
  )
);