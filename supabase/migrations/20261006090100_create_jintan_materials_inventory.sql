-- ============================================================
-- 金檀木业素材库存（素材资料 + 库存数量）
--   jintan_materials_inventory  素材库存，与 jintan_materials_data 一对一
--   素材资料新增时自动建 0 库存行；型号/名称/规格/材质变更时同步快照
--   删除素材资料时级联删除对应库存行
-- ============================================================

create table if not exists public.jintan_materials_inventory (
  id               uuid primary key default gen_random_uuid(),
  material_data_id uuid not null references public.jintan_materials_data (id) on update cascade on delete cascade,
  material_model   text not null default '',
  material_name    text not null,
  specification    text not null default '',
  material         text not null default '',
  quantity         integer not null default 0,
  remarks          text not null default '',
  created_at       timestamp with time zone not null default now(),
  updated_at       timestamp with time zone not null default now(),
  constraint jintan_materials_inventory_material_name_not_blank check (btrim(material_name) <> ''),
  constraint jintan_materials_inventory_quantity_non_negative check (quantity >= 0),
  constraint jintan_materials_inventory_material_data_unique unique (material_data_id)
);

comment on table public.jintan_materials_inventory is '金檀木业素材库存';
comment on column public.jintan_materials_inventory.material_data_id is '关联素材资料 ID';
comment on column public.jintan_materials_inventory.material_model is '型号快照';
comment on column public.jintan_materials_inventory.material_name is '名称快照';
comment on column public.jintan_materials_inventory.specification is '规格快照';
comment on column public.jintan_materials_inventory.material is '材质快照';
comment on column public.jintan_materials_inventory.quantity is '库存数量';
comment on column public.jintan_materials_inventory.remarks is '备注';

create index if not exists idx_jintan_materials_inventory_updated_at_desc
on public.jintan_materials_inventory (updated_at desc);

drop trigger if exists update_jintan_materials_inventory_updated_at on public.jintan_materials_inventory;
create trigger update_jintan_materials_inventory_updated_at
before update on public.jintan_materials_inventory
for each row execute function public.update_updated_at_column();

drop trigger if exists prevent_viewer_dml_trigger on public.jintan_materials_inventory;
create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.jintan_materials_inventory
for each row execute function public.prevent_viewer_dml();

-- 素材资料新增/更新时同步库存行与快照
create or replace function public.handle_jintan_materials_data_inventory_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.jintan_materials_inventory (
      material_data_id,
      material_model,
      material_name,
      specification,
      material
    )
    values (
      new.id,
      new.material_model,
      new.material_name,
      new.specification,
      new.material
    )
    on conflict (material_data_id) do nothing;
    return new;
  end if;

  update public.jintan_materials_inventory
  set material_model = new.material_model,
      material_name = new.material_name,
      specification = new.specification,
      material = new.material
  where material_data_id = new.id
    and (material_model, material_name, specification, material)
      is distinct from (new.material_model, new.material_name, new.specification, new.material);

  return new;
end;
$$;

drop trigger if exists jintan_materials_data_inventory_sync on public.jintan_materials_data;
create trigger jintan_materials_data_inventory_sync
after insert or update of material_model, material_name, specification, material on public.jintan_materials_data
for each row execute function public.handle_jintan_materials_data_inventory_sync();

alter table public.jintan_materials_inventory enable row level security;

drop policy if exists "Jintan materials inventory admin all" on public.jintan_materials_inventory;
create policy "Jintan materials inventory admin all"
on public.jintan_materials_inventory
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Jintan materials inventory permission rw" on public.jintan_materials_inventory;
create policy "Jintan materials inventory permission rw"
on public.jintan_materials_inventory
for all
to authenticated
using (public.current_user_has_permission('page:jintan-materials-inventory'))
with check (public.current_user_has_permission('page:jintan-materials-inventory'));
