-- ============================================================
-- 金檀木业型材库存（型材资料 + 库存数量）
--   jintan_profiles_inventory  型材库存，与 jintan_profiles_data 一对一
--   型材资料新增时自动建 0 库存行；型号/名称/规格/材质变更时同步快照
--   删除型材资料时级联删除对应库存行
-- ============================================================

create table if not exists public.jintan_profiles_inventory (
  id              uuid primary key default gen_random_uuid(),
  profile_data_id uuid not null references public.jintan_profiles_data (id) on update cascade on delete cascade,
  profile_model   text not null default '',
  profile_name    text not null,
  specification   text not null default '',
  material        text not null default '',
  quantity        integer not null default 0,
  remarks         text not null default '',
  created_at      timestamp with time zone not null default now(),
  updated_at      timestamp with time zone not null default now(),
  constraint jintan_profiles_inventory_profile_name_not_blank check (btrim(profile_name) <> ''),
  constraint jintan_profiles_inventory_quantity_non_negative check (quantity >= 0),
  constraint jintan_profiles_inventory_profile_data_unique unique (profile_data_id)
);

comment on table public.jintan_profiles_inventory is '金檀木业型材库存';
comment on column public.jintan_profiles_inventory.profile_data_id is '关联型材资料 ID';
comment on column public.jintan_profiles_inventory.profile_model is '型号快照';
comment on column public.jintan_profiles_inventory.profile_name is '名称快照';
comment on column public.jintan_profiles_inventory.specification is '规格快照';
comment on column public.jintan_profiles_inventory.material is '材质快照';
comment on column public.jintan_profiles_inventory.quantity is '库存数量';
comment on column public.jintan_profiles_inventory.remarks is '备注';

create index if not exists idx_jintan_profiles_inventory_updated_at_desc
on public.jintan_profiles_inventory (updated_at desc);

drop trigger if exists update_jintan_profiles_inventory_updated_at on public.jintan_profiles_inventory;
create trigger update_jintan_profiles_inventory_updated_at
before update on public.jintan_profiles_inventory
for each row execute function public.update_updated_at_column();

drop trigger if exists prevent_viewer_dml_trigger on public.jintan_profiles_inventory;
create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.jintan_profiles_inventory
for each row execute function public.prevent_viewer_dml();

-- 型材资料新增/更新时同步库存行与快照
create or replace function public.handle_jintan_profiles_data_inventory_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.jintan_profiles_inventory (
      profile_data_id,
      profile_model,
      profile_name,
      specification,
      material
    )
    values (
      new.id,
      new.profile_model,
      new.profile_name,
      new.specification,
      new.material
    )
    on conflict (profile_data_id) do nothing;
    return new;
  end if;

  update public.jintan_profiles_inventory
  set profile_model = new.profile_model,
      profile_name = new.profile_name,
      specification = new.specification,
      material = new.material
  where profile_data_id = new.id
    and (profile_model, profile_name, specification, material)
      is distinct from (new.profile_model, new.profile_name, new.specification, new.material);

  return new;
end;
$$;

drop trigger if exists jintan_profiles_data_inventory_sync on public.jintan_profiles_data;
create trigger jintan_profiles_data_inventory_sync
after insert or update of profile_model, profile_name, specification, material on public.jintan_profiles_data
for each row execute function public.handle_jintan_profiles_data_inventory_sync();

alter table public.jintan_profiles_inventory enable row level security;

drop policy if exists "Jintan profiles inventory admin all" on public.jintan_profiles_inventory;
create policy "Jintan profiles inventory admin all"
on public.jintan_profiles_inventory
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Jintan profiles inventory permission rw" on public.jintan_profiles_inventory;
create policy "Jintan profiles inventory permission rw"
on public.jintan_profiles_inventory
for all
to authenticated
using (public.current_user_has_permission('page:jintan-profiles-inventory'))
with check (public.current_user_has_permission('page:jintan-profiles-inventory'));
