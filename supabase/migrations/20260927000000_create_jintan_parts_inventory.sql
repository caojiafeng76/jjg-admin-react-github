-- ============================================================
-- 金檀木业配件库存（配件资料 + 库存数量）
--   jintan_parts_inventory  配件库存，与 jintan_parts_data 一对一
--   配件资料新增时自动建 0 库存行；名称/规格/材质/采购厂家变更时同步快照
--   删除配件资料时级联删除对应库存行
-- ============================================================

create table if not exists public.jintan_parts_inventory (
  id            uuid primary key default gen_random_uuid(),
  part_data_id  uuid not null references public.jintan_parts_data (id) on update cascade on delete cascade,
  part_name     text not null,
  specification text not null default '',
  material      text not null default '',
  supplier      text not null default '',
  quantity      integer not null default 0,
  remarks       text not null default '',
  created_at    timestamp with time zone not null default now(),
  updated_at    timestamp with time zone not null default now(),
  constraint jintan_parts_inventory_part_name_not_blank check (btrim(part_name) <> ''),
  constraint jintan_parts_inventory_quantity_non_negative check (quantity >= 0),
  constraint jintan_parts_inventory_part_data_unique unique (part_data_id)
);

comment on table public.jintan_parts_inventory is '金檀木业配件库存';
comment on column public.jintan_parts_inventory.part_data_id is '关联配件资料 ID';
comment on column public.jintan_parts_inventory.part_name is '名称快照';
comment on column public.jintan_parts_inventory.specification is '规格快照';
comment on column public.jintan_parts_inventory.material is '材质快照';
comment on column public.jintan_parts_inventory.supplier is '采购厂家快照';
comment on column public.jintan_parts_inventory.quantity is '库存数量';
comment on column public.jintan_parts_inventory.remarks is '备注';

create index if not exists idx_jintan_parts_inventory_updated_at_desc
on public.jintan_parts_inventory (updated_at desc);

drop trigger if exists update_jintan_parts_inventory_updated_at on public.jintan_parts_inventory;
create trigger update_jintan_parts_inventory_updated_at
before update on public.jintan_parts_inventory
for each row execute function public.update_updated_at_column();

drop trigger if exists prevent_viewer_dml_trigger on public.jintan_parts_inventory;
create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.jintan_parts_inventory
for each row execute function public.prevent_viewer_dml();

-- 配件资料新增/更新时同步库存行与快照
create or replace function public.handle_jintan_parts_data_inventory_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.jintan_parts_inventory (
      part_data_id,
      part_name,
      specification,
      material,
      supplier
    )
    values (
      new.id,
      new.part_name,
      new.specification,
      new.material,
      new.supplier
    )
    on conflict (part_data_id) do nothing;
    return new;
  end if;

  update public.jintan_parts_inventory
  set part_name = new.part_name,
      specification = new.specification,
      material = new.material,
      supplier = new.supplier
  where part_data_id = new.id
    and (part_name, specification, material, supplier)
      is distinct from (new.part_name, new.specification, new.material, new.supplier);

  return new;
end;
$$;

drop trigger if exists jintan_parts_data_inventory_sync on public.jintan_parts_data;
create trigger jintan_parts_data_inventory_sync
after insert or update of part_name, specification, material, supplier on public.jintan_parts_data
for each row execute function public.handle_jintan_parts_data_inventory_sync();

alter table public.jintan_parts_inventory enable row level security;

drop policy if exists "Jintan parts inventory admin all" on public.jintan_parts_inventory;
create policy "Jintan parts inventory admin all"
on public.jintan_parts_inventory
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Jintan parts inventory permission rw" on public.jintan_parts_inventory;
create policy "Jintan parts inventory permission rw"
on public.jintan_parts_inventory
for all
to authenticated
using (public.current_user_has_permission('page:jintan-parts-inventory'))
with check (public.current_user_has_permission('page:jintan-parts-inventory'));
