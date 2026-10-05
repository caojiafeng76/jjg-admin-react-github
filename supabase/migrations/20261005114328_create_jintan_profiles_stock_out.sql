create table public.jintan_profiles_stock_out (
  id            uuid primary key default gen_random_uuid(),
  inventory_id  uuid not null references public.jintan_profiles_inventory (id) on delete restrict,
  profile_model text not null default '',
  profile_name  text not null default '',
  specification text not null default '',
  material      text not null default '',
  quantity      integer not null check (quantity > 0),
  remarks       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.jintan_profiles_stock_out is '金檀木业型材出库流水';
comment on column public.jintan_profiles_stock_out.inventory_id is '关联型材库存 ID';
comment on column public.jintan_profiles_stock_out.quantity is '出库数量，正整数';

create index idx_jintan_profiles_stock_out_created_at_desc
  on public.jintan_profiles_stock_out (created_at desc);
create index idx_jintan_profiles_stock_out_inventory_id
  on public.jintan_profiles_stock_out (inventory_id);

create trigger update_jintan_profiles_stock_out_updated_at
before update on public.jintan_profiles_stock_out
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.jintan_profiles_stock_out
for each row execute function public.prevent_viewer_dml();

-- 快照由数据库填写，客户端不能伪造型材资料。扣减库存与流水处于同一事务。
create function public.handle_jintan_profiles_stock_out()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select profile_model, profile_name, specification, material
      into new.profile_model, new.profile_name, new.specification, new.material
    from public.jintan_profiles_inventory
    where id = new.inventory_id;

    if not found then
      raise exception '型材库存不存在，无法出库';
    end if;

    update public.jintan_profiles_inventory
    set quantity = quantity - new.quantity
    where id = new.inventory_id and quantity >= new.quantity;

    if not found then
      raise exception '当前库存不足，无法出库';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.profile_model, new.profile_name,
        new.specification, new.material, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.profile_model, old.profile_name,
        old.specification, old.material, old.quantity, old.created_at) then
      raise exception '出库记录仅允许修改备注';
    end if;
    return new;
  end if;

  update public.jintan_profiles_inventory
  set quantity = quantity + old.quantity
  where id = old.inventory_id;

  if not found then
    raise exception '型材库存不存在，无法回补库存';
  end if;
  return old;
end;
$$;

revoke all on function public.handle_jintan_profiles_stock_out() from public;

create trigger jintan_profiles_stock_out_apply
before insert or update or delete on public.jintan_profiles_stock_out
for each row execute function public.handle_jintan_profiles_stock_out();

alter table public.jintan_profiles_stock_out enable row level security;
revoke all on public.jintan_profiles_stock_out from anon, authenticated;
grant select, insert, update, delete on public.jintan_profiles_stock_out to authenticated;

create policy "Jintan profiles stock out admin all"
on public.jintan_profiles_stock_out for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Jintan profiles stock out permission rw"
on public.jintan_profiles_stock_out for all to authenticated
using (public.current_user_has_permission('page:jintan-profiles-stock-out'))
with check (public.current_user_has_permission('page:jintan-profiles-stock-out'));

create policy "Jintan profiles inventory select for stock out"
on public.jintan_profiles_inventory for select to authenticated
using (public.current_user_has_permission('page:jintan-profiles-stock-out'));
