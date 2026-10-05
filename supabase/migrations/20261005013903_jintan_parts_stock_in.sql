create table public.jintan_parts_stock_in (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.jintan_parts_inventory (id) on delete restrict,
  part_name text not null,
  specification text not null default '',
  material text not null default '',
  supplier text not null default '',
  quantity integer not null check (quantity > 0),
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.jintan_parts_stock_in is '金檀木业配件入库流水';
comment on column public.jintan_parts_stock_in.inventory_id is '关联配件库存 ID';
comment on column public.jintan_parts_stock_in.quantity is '入库数量，正整数';

create index idx_jintan_parts_stock_in_created_at_desc
  on public.jintan_parts_stock_in (created_at desc);
create index idx_jintan_parts_stock_in_inventory_id
  on public.jintan_parts_stock_in (inventory_id);

create trigger update_jintan_parts_stock_in_updated_at
before update on public.jintan_parts_stock_in
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.jintan_parts_stock_in
for each row execute function public.prevent_viewer_dml();

-- 快照由数据库填写，客户端不能伪造配件资料。写入库存与流水处于同一事务。
create function public.handle_jintan_parts_stock_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select part_name, specification, material, supplier
      into new.part_name, new.specification, new.material, new.supplier
    from public.jintan_parts_inventory
    where id = new.inventory_id;

    if not found then
      raise exception '配件库存不存在，无法入库';
    end if;

    update public.jintan_parts_inventory
    set quantity = quantity + new.quantity
    where id = new.inventory_id;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.part_name, new.specification,
        new.material, new.supplier, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.part_name, old.specification,
        old.material, old.supplier, old.quantity, old.created_at) then
      raise exception '入库记录仅允许修改备注';
    end if;
    return new;
  end if;

  update public.jintan_parts_inventory
  set quantity = quantity - old.quantity
  where id = old.inventory_id and quantity >= old.quantity;

  if not found then
    raise exception '当前库存不足，无法删除该入库记录';
  end if;
  return old;
end;
$$;

revoke all on function public.handle_jintan_parts_stock_in() from public;

create trigger jintan_parts_stock_in_apply
before insert or update or delete on public.jintan_parts_stock_in
for each row execute function public.handle_jintan_parts_stock_in();

alter table public.jintan_parts_stock_in enable row level security;
revoke all on public.jintan_parts_stock_in from anon, authenticated;
grant select, insert, update, delete on public.jintan_parts_stock_in to authenticated;

create policy "Jintan parts stock in admin all"
on public.jintan_parts_stock_in for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Jintan parts stock in permission rw"
on public.jintan_parts_stock_in for all to authenticated
using (public.current_user_has_permission('page:jintan-parts-stock-in'))
with check (public.current_user_has_permission('page:jintan-parts-stock-in'));

create policy "Jintan parts inventory select for stock in"
on public.jintan_parts_inventory for select to authenticated
using (public.current_user_has_permission('page:jintan-parts-stock-in'));
