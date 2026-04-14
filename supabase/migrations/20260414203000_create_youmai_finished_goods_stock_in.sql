create table if not exists public.youmai_finished_goods_stock_in (
  id uuid primary key default gen_random_uuid(),
  product_data_id uuid not null references public.youmai_product_data (id) on update cascade on delete restrict,
  material_code text not null,
  material_name text not null,
  model text not null,
  specification text not null,
  specific_gravity numeric(12, 6) not null,
  status text not null default '待审核',
  stock_in_quantity numeric(12, 3) not null,
  remarks text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint youmai_finished_goods_stock_in_material_code_not_blank check (btrim(material_code) <> ''),
  constraint youmai_finished_goods_stock_in_material_name_not_blank check (btrim(material_name) <> ''),
  constraint youmai_finished_goods_stock_in_model_not_blank check (btrim(model) <> ''),
  constraint youmai_finished_goods_stock_in_specification_not_blank check (btrim(specification) <> ''),
  constraint youmai_finished_goods_stock_in_specific_gravity_non_negative check (specific_gravity >= 0::numeric),
  constraint youmai_finished_goods_stock_in_status_valid check (status in ('待审核', '已审核')),
  constraint youmai_finished_goods_stock_in_quantity_positive check (stock_in_quantity > 0::numeric)
);
comment on table public.youmai_finished_goods_stock_in is '优迈成品入库';
comment on column public.youmai_finished_goods_stock_in.product_data_id is '关联优迈货品资料 ID';
comment on column public.youmai_finished_goods_stock_in.material_code is '物料编码快照';
comment on column public.youmai_finished_goods_stock_in.material_name is '物料名称快照';
comment on column public.youmai_finished_goods_stock_in.model is '型号快照';
comment on column public.youmai_finished_goods_stock_in.specification is '规格快照';
comment on column public.youmai_finished_goods_stock_in.specific_gravity is '比重快照';
comment on column public.youmai_finished_goods_stock_in.status is '状态';
comment on column public.youmai_finished_goods_stock_in.stock_in_quantity is '入库数量';
comment on column public.youmai_finished_goods_stock_in.remarks is '备注';
create index if not exists idx_youmai_finished_goods_stock_in_product_data_id on public.youmai_finished_goods_stock_in (product_data_id);
create index if not exists idx_youmai_finished_goods_stock_in_status on public.youmai_finished_goods_stock_in (status);
create index if not exists idx_youmai_finished_goods_stock_in_updated_at_desc on public.youmai_finished_goods_stock_in (updated_at desc);
drop trigger if exists update_youmai_finished_goods_stock_in_updated_at on public.youmai_finished_goods_stock_in;
create trigger update_youmai_finished_goods_stock_in_updated_at before
update on public.youmai_finished_goods_stock_in for each row execute function public.update_updated_at_column();
alter table public.youmai_finished_goods_stock_in enable row level security;
drop policy if exists "Youmai finished goods stock in admin all" on public.youmai_finished_goods_stock_in;
create policy "Youmai finished goods stock in admin all" on public.youmai_finished_goods_stock_in for all to authenticated using (public.is_admin()) with check (public.is_admin());
create or replace function public.ensure_youmai_finished_goods_inventory_row(
    target_product_data_id uuid,
    snapshot_material_code text,
    snapshot_material_name text,
    snapshot_model text,
    snapshot_specification text,
    snapshot_specific_gravity numeric
  ) returns void language plpgsql as $$ begin
insert into public.youmai_finished_goods_inventory (
    product_data_id,
    material_code,
    material_name,
    model,
    specification,
    specific_gravity
  )
values (
    target_product_data_id,
    snapshot_material_code,
    snapshot_material_name,
    snapshot_model,
    snapshot_specification,
    snapshot_specific_gravity
  ) on conflict (product_data_id) do
update
set material_code = excluded.material_code,
  material_name = excluded.material_name,
  model = excluded.model,
  specification = excluded.specification,
  specific_gravity = excluded.specific_gravity,
  updated_at = now();
end;
$$;
create or replace function public.refresh_youmai_inventory_pending_stock_in(target_product_data_id uuid) returns void language plpgsql as $$ begin
update public.youmai_finished_goods_inventory
set pending_stock_in = coalesce(
    (
      select sum(stock_in_quantity)
      from public.youmai_finished_goods_stock_in
      where product_data_id = target_product_data_id
        and status = '待审核'
    ),
    0::numeric
  )
where product_data_id = target_product_data_id;
end;
$$;
create or replace function public.handle_youmai_finished_goods_stock_in_inventory_sync() returns trigger language plpgsql as $$ begin if tg_op = 'INSERT' then perform public.ensure_youmai_finished_goods_inventory_row(
    new.product_data_id,
    new.material_code,
    new.material_name,
    new.model,
    new.specification,
    new.specific_gravity
  );
if new.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + new.stock_in_quantity
where product_data_id = new.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_in(new.product_data_id);
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
set current_stock = current_stock - old.stock_in_quantity
where product_data_id = old.product_data_id;
end if;
if new.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + new.stock_in_quantity
where product_data_id = new.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_in(old.product_data_id);
perform public.refresh_youmai_inventory_pending_stock_in(new.product_data_id);
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
and new.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + (new.stock_in_quantity - old.stock_in_quantity)
where product_data_id = new.product_data_id;
elsif old.status = '已审核'
and new.status <> '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock - old.stock_in_quantity
where product_data_id = new.product_data_id;
elsif old.status <> '已审核'
and new.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + new.stock_in_quantity
where product_data_id = new.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_in(new.product_data_id);
return new;
end if;
if old.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock - old.stock_in_quantity
where product_data_id = old.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_in(old.product_data_id);
return old;
end;
$$;
drop trigger if exists sync_youmai_finished_goods_stock_in_inventory on public.youmai_finished_goods_stock_in;
create trigger sync_youmai_finished_goods_stock_in_inventory
after
insert
  or
update
  or delete on public.youmai_finished_goods_stock_in for each row execute function public.handle_youmai_finished_goods_stock_in_inventory_sync();