create table if not exists public.youmai_finished_goods_stock_out (
  id uuid primary key default gen_random_uuid(),
  product_data_id uuid not null references public.youmai_product_data (id) on update cascade on delete restrict,
  material_code text not null,
  material_name text not null,
  model text not null,
  specification text not null,
  specific_gravity numeric(12, 6) not null,
  purchase_order_no text not null,
  purchase_order_line_no text not null,
  delivery_date date not null,
  status text not null default '待审核',
  stock_out_quantity numeric(12, 3) not null,
  remarks text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint youmai_finished_goods_stock_out_material_code_not_blank check (btrim(material_code) <> ''),
  constraint youmai_finished_goods_stock_out_material_name_not_blank check (btrim(material_name) <> ''),
  constraint youmai_finished_goods_stock_out_model_not_blank check (btrim(model) <> ''),
  constraint youmai_finished_goods_stock_out_specification_not_blank check (btrim(specification) <> ''),
  constraint youmai_finished_goods_stock_out_purchase_order_no_not_blank check (btrim(purchase_order_no) <> ''),
  constraint youmai_finished_goods_stock_out_purchase_order_line_no_not_blank check (btrim(purchase_order_line_no) <> ''),
  constraint youmai_finished_goods_stock_out_specific_gravity_non_negative check (specific_gravity >= 0::numeric),
  constraint youmai_finished_goods_stock_out_status_valid check (status in ('待审核', '已审核')),
  constraint youmai_finished_goods_stock_out_quantity_positive check (stock_out_quantity > 0::numeric)
);
comment on table public.youmai_finished_goods_stock_out is '优迈成品出库';
comment on column public.youmai_finished_goods_stock_out.product_data_id is '关联优迈货品资料 ID';
comment on column public.youmai_finished_goods_stock_out.material_code is '物料编码快照';
comment on column public.youmai_finished_goods_stock_out.material_name is '物料名称快照';
comment on column public.youmai_finished_goods_stock_out.model is '型号快照';
comment on column public.youmai_finished_goods_stock_out.specification is '规格快照';
comment on column public.youmai_finished_goods_stock_out.specific_gravity is '比重快照';
comment on column public.youmai_finished_goods_stock_out.purchase_order_no is '采购订单号';
comment on column public.youmai_finished_goods_stock_out.purchase_order_line_no is '采购订单行号';
comment on column public.youmai_finished_goods_stock_out.delivery_date is '交货日期';
comment on column public.youmai_finished_goods_stock_out.status is '状态';
comment on column public.youmai_finished_goods_stock_out.stock_out_quantity is '出库数量';
comment on column public.youmai_finished_goods_stock_out.remarks is '备注';
create unique index if not exists idx_youmai_finished_goods_stock_out_order_line_unique on public.youmai_finished_goods_stock_out (purchase_order_no, purchase_order_line_no);
create index if not exists idx_youmai_finished_goods_stock_out_product_data_id on public.youmai_finished_goods_stock_out (product_data_id);
create index if not exists idx_youmai_finished_goods_stock_out_status on public.youmai_finished_goods_stock_out (status);
create index if not exists idx_youmai_finished_goods_stock_out_updated_at_desc on public.youmai_finished_goods_stock_out (updated_at desc);
drop trigger if exists update_youmai_finished_goods_stock_out_updated_at on public.youmai_finished_goods_stock_out;
create trigger update_youmai_finished_goods_stock_out_updated_at before
update on public.youmai_finished_goods_stock_out for each row execute function public.update_updated_at_column();
alter table public.youmai_finished_goods_stock_out enable row level security;
drop policy if exists "Youmai finished goods stock out admin all" on public.youmai_finished_goods_stock_out;
create policy "Youmai finished goods stock out admin all" on public.youmai_finished_goods_stock_out for all to authenticated using (public.is_admin()) with check (public.is_admin());
create or replace function public.refresh_youmai_inventory_pending_stock_out(target_product_data_id uuid) returns void language plpgsql as $$ begin
update public.youmai_finished_goods_inventory
set pending_stock_out = coalesce(
    (
      select sum(stock_out_quantity)
      from public.youmai_finished_goods_stock_out
      where product_data_id = target_product_data_id
        and status = '待审核'
    ),
    0::numeric
  )
where product_data_id = target_product_data_id;
end;
$$;
create or replace function public.apply_youmai_finished_goods_stock_out_audit(
    target_product_data_id uuid,
    target_stock_out_quantity numeric
  ) returns void language plpgsql as $$ begin
update public.youmai_finished_goods_inventory
set current_stock = current_stock - target_stock_out_quantity
where product_data_id = target_product_data_id
  and current_stock >= target_stock_out_quantity;
if not found then raise exception '优迈成品库存不足，无法审核出库';
end if;
end;
$$;
create or replace function public.handle_youmai_finished_goods_stock_out_inventory_sync() returns trigger language plpgsql as $$ begin if tg_op = 'INSERT' then perform public.ensure_youmai_finished_goods_inventory_row(
    new.product_data_id,
    new.material_code,
    new.material_name,
    new.model,
    new.specification,
    new.specific_gravity
  );
if new.status = '已审核' then perform public.apply_youmai_finished_goods_stock_out_audit(new.product_data_id, new.stock_out_quantity);
end if;
perform public.refresh_youmai_inventory_pending_stock_out(new.product_data_id);
return new;
end if;
if tg_op = 'UPDATE' then if old.product_data_id <> new.product_data_id then perform public.ensure_youmai_finished_goods_inventory_row(
  new.product_data_id,
  new.material_code,
  new.material_name,
  new.model,
  new.specification,
  new.specific_gravity
);
if old.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + old.stock_out_quantity
where product_data_id = old.product_data_id;
end if;
if new.status = '已审核' then perform public.apply_youmai_finished_goods_stock_out_audit(new.product_data_id, new.stock_out_quantity);
end if;
perform public.refresh_youmai_inventory_pending_stock_out(old.product_data_id);
perform public.refresh_youmai_inventory_pending_stock_out(new.product_data_id);
return new;
end if;
perform public.ensure_youmai_finished_goods_inventory_row(
  new.product_data_id,
  new.material_code,
  new.material_name,
  new.model,
  new.specification,
  new.specific_gravity
);
if old.status = '已审核'
and new.status = '已审核' then if new.stock_out_quantity > old.stock_out_quantity then perform public.apply_youmai_finished_goods_stock_out_audit(
  new.product_data_id,
  new.stock_out_quantity - old.stock_out_quantity
);
elsif new.stock_out_quantity < old.stock_out_quantity then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + (old.stock_out_quantity - new.stock_out_quantity)
where product_data_id = new.product_data_id;
end if;
elsif old.status = '已审核'
and new.status <> '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + old.stock_out_quantity
where product_data_id = new.product_data_id;
elsif old.status <> '已审核'
and new.status = '已审核' then perform public.apply_youmai_finished_goods_stock_out_audit(new.product_data_id, new.stock_out_quantity);
end if;
perform public.refresh_youmai_inventory_pending_stock_out(new.product_data_id);
return new;
end if;
if old.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + old.stock_out_quantity
where product_data_id = old.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_out(old.product_data_id);
return old;
end;
$$;
drop trigger if exists sync_youmai_finished_goods_stock_out_inventory on public.youmai_finished_goods_stock_out;
create trigger sync_youmai_finished_goods_stock_out_inventory
after
insert
  or
update
  or delete on public.youmai_finished_goods_stock_out for each row execute function public.handle_youmai_finished_goods_stock_out_inventory_sync();