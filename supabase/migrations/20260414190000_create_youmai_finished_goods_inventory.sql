create table if not exists public.youmai_finished_goods_inventory (
  id uuid primary key default gen_random_uuid(),
  product_data_id uuid not null references public.youmai_product_data (id) on update cascade on delete restrict,
  material_code text not null,
  material_name text not null,
  model text not null,
  specification text not null,
  specific_gravity numeric(12, 6) not null,
  pending_stock_in numeric(12, 3) not null default 0,
  pending_stock_out numeric(12, 3) not null default 0,
  current_stock numeric(12, 3) not null default 0,
  final_stock numeric(12, 3) generated always as (
    (current_stock + pending_stock_in) - pending_stock_out
  ) stored,
  remarks text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint youmai_finished_goods_inventory_material_code_not_blank check (btrim(material_code) <> ''),
  constraint youmai_finished_goods_inventory_material_name_not_blank check (btrim(material_name) <> ''),
  constraint youmai_finished_goods_inventory_model_not_blank check (btrim(model) <> ''),
  constraint youmai_finished_goods_inventory_specification_not_blank check (btrim(specification) <> ''),
  constraint youmai_finished_goods_inventory_specific_gravity_non_negative check (specific_gravity >= 0::numeric),
  constraint youmai_finished_goods_inventory_pending_stock_in_non_negative check (pending_stock_in >= 0::numeric),
  constraint youmai_finished_goods_inventory_pending_stock_out_non_negative check (pending_stock_out >= 0::numeric),
  constraint youmai_finished_goods_inventory_current_stock_non_negative check (current_stock >= 0::numeric)
);
comment on table public.youmai_finished_goods_inventory is '优迈成品库存';
comment on column public.youmai_finished_goods_inventory.product_data_id is '关联优迈货品资料 ID';
comment on column public.youmai_finished_goods_inventory.material_code is '物料编码快照';
comment on column public.youmai_finished_goods_inventory.material_name is '物料名称快照';
comment on column public.youmai_finished_goods_inventory.model is '型号快照';
comment on column public.youmai_finished_goods_inventory.specification is '规格快照';
comment on column public.youmai_finished_goods_inventory.specific_gravity is '比重快照';
comment on column public.youmai_finished_goods_inventory.pending_stock_in is '待入库';
comment on column public.youmai_finished_goods_inventory.pending_stock_out is '待出库';
comment on column public.youmai_finished_goods_inventory.current_stock is '现有库存';
comment on column public.youmai_finished_goods_inventory.final_stock is '最终库存';
comment on column public.youmai_finished_goods_inventory.remarks is '备注';
create unique index if not exists idx_youmai_finished_goods_inventory_product_data_unique on public.youmai_finished_goods_inventory (product_data_id);
create index if not exists idx_youmai_finished_goods_inventory_material_code on public.youmai_finished_goods_inventory (material_code);
create index if not exists idx_youmai_finished_goods_inventory_updated_at_desc on public.youmai_finished_goods_inventory (updated_at desc);
drop trigger if exists update_youmai_finished_goods_inventory_updated_at on public.youmai_finished_goods_inventory;
create trigger update_youmai_finished_goods_inventory_updated_at before
update on public.youmai_finished_goods_inventory for each row execute function public.update_updated_at_column();
alter table public.youmai_finished_goods_inventory enable row level security;
drop policy if exists "Youmai finished goods inventory admin all" on public.youmai_finished_goods_inventory;
create policy "Youmai finished goods inventory admin all" on public.youmai_finished_goods_inventory for all to authenticated using (public.is_admin()) with check (public.is_admin());