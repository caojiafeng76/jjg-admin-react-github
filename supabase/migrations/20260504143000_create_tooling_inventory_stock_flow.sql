create table if not exists public.tooling_inventory (
  id uuid primary key default gen_random_uuid(),
  tooling_data_id uuid not null references public.tooling_data (id) on update cascade on delete restrict,
  tool_code text not null,
  tool_name text not null,
  tool_spec text not null,
  material text not null,
  unit_price numeric(12, 2) not null,
  pending_stock_in numeric(12, 3) not null default 0,
  pending_stock_out numeric(12, 3) not null default 0,
  current_stock numeric(12, 3) not null default 0,
  final_stock numeric(12, 3) generated always as (
    (current_stock + pending_stock_in) - pending_stock_out
  ) stored,
  remarks text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tooling_inventory_tool_code_not_blank check (btrim(tool_code) <> ''),
  constraint tooling_inventory_tool_name_not_blank check (btrim(tool_name) <> ''),
  constraint tooling_inventory_tool_spec_not_blank check (btrim(tool_spec) <> ''),
  constraint tooling_inventory_material_not_blank check (btrim(material) <> ''),
  constraint tooling_inventory_unit_price_non_negative check (unit_price >= 0::numeric),
  constraint tooling_inventory_pending_stock_in_non_negative check (pending_stock_in >= 0::numeric),
  constraint tooling_inventory_pending_stock_out_non_negative check (pending_stock_out >= 0::numeric),
  constraint tooling_inventory_current_stock_non_negative check (current_stock >= 0::numeric)
);
comment on table public.tooling_inventory is '刀具库存';
comment on column public.tooling_inventory.tooling_data_id is '关联刀具资料 ID';
comment on column public.tooling_inventory.tool_code is '刀具编号快照';
comment on column public.tooling_inventory.tool_name is '刀具名称快照';
comment on column public.tooling_inventory.tool_spec is '刀具规格快照';
comment on column public.tooling_inventory.material is '材质快照';
comment on column public.tooling_inventory.unit_price is '单价快照';
comment on column public.tooling_inventory.pending_stock_in is '待入库';
comment on column public.tooling_inventory.pending_stock_out is '待出库';
comment on column public.tooling_inventory.current_stock is '现有库存';
comment on column public.tooling_inventory.final_stock is '最终库存';
comment on column public.tooling_inventory.remarks is '备注';
create unique index if not exists idx_tooling_inventory_tooling_data_unique on public.tooling_inventory (tooling_data_id);
create index if not exists idx_tooling_inventory_tool_code on public.tooling_inventory (tool_code);
create index if not exists idx_tooling_inventory_updated_at_desc on public.tooling_inventory (updated_at desc);
drop trigger if exists update_tooling_inventory_updated_at on public.tooling_inventory;
create trigger update_tooling_inventory_updated_at before
update on public.tooling_inventory for each row execute function public.update_updated_at_column();
alter table public.tooling_inventory enable row level security;
drop policy if exists "Tooling inventory admin all" on public.tooling_inventory;
create policy "Tooling inventory admin all" on public.tooling_inventory for all to authenticated using (public.is_admin()) with check (public.is_admin());
create table if not exists public.tooling_stock_in (
  id uuid primary key default gen_random_uuid(),
  tooling_data_id uuid not null references public.tooling_data (id) on update cascade on delete restrict,
  tool_code text not null,
  tool_name text not null,
  tool_spec text not null,
  material text not null,
  unit_price numeric(12, 2) not null,
  status text not null default '待审核',
  stock_in_quantity numeric(12, 3) not null,
  remarks text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tooling_stock_in_tool_code_not_blank check (btrim(tool_code) <> ''),
  constraint tooling_stock_in_tool_name_not_blank check (btrim(tool_name) <> ''),
  constraint tooling_stock_in_tool_spec_not_blank check (btrim(tool_spec) <> ''),
  constraint tooling_stock_in_material_not_blank check (btrim(material) <> ''),
  constraint tooling_stock_in_unit_price_non_negative check (unit_price >= 0::numeric),
  constraint tooling_stock_in_status_valid check (status in ('待审核', '已审核')),
  constraint tooling_stock_in_quantity_positive check (stock_in_quantity > 0::numeric)
);
comment on table public.tooling_stock_in is '刀具入库';
comment on column public.tooling_stock_in.tooling_data_id is '关联刀具资料 ID';
comment on column public.tooling_stock_in.tool_code is '刀具编号快照';
comment on column public.tooling_stock_in.tool_name is '刀具名称快照';
comment on column public.tooling_stock_in.tool_spec is '刀具规格快照';
comment on column public.tooling_stock_in.material is '材质快照';
comment on column public.tooling_stock_in.unit_price is '单价快照';
comment on column public.tooling_stock_in.status is '状态';
comment on column public.tooling_stock_in.stock_in_quantity is '入库数量';
comment on column public.tooling_stock_in.remarks is '备注';
create index if not exists idx_tooling_stock_in_tooling_data_id on public.tooling_stock_in (tooling_data_id);
create index if not exists idx_tooling_stock_in_status on public.tooling_stock_in (status);
create index if not exists idx_tooling_stock_in_updated_at_desc on public.tooling_stock_in (updated_at desc);
drop trigger if exists update_tooling_stock_in_updated_at on public.tooling_stock_in;
create trigger update_tooling_stock_in_updated_at before
update on public.tooling_stock_in for each row execute function public.update_updated_at_column();
alter table public.tooling_stock_in enable row level security;
drop policy if exists "Tooling stock in admin all" on public.tooling_stock_in;
create policy "Tooling stock in admin all" on public.tooling_stock_in for all to authenticated using (public.is_admin()) with check (public.is_admin());
create table if not exists public.tooling_stock_out (
  id uuid primary key default gen_random_uuid(),
  tooling_data_id uuid not null references public.tooling_data (id) on update cascade on delete restrict,
  tool_code text not null,
  tool_name text not null,
  tool_spec text not null,
  material text not null,
  unit_price numeric(12, 2) not null,
  recipient text not null,
  purpose text not null,
  stock_out_date date not null,
  status text not null default '待审核',
  stock_out_quantity numeric(12, 3) not null,
  remarks text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tooling_stock_out_tool_code_not_blank check (btrim(tool_code) <> ''),
  constraint tooling_stock_out_tool_name_not_blank check (btrim(tool_name) <> ''),
  constraint tooling_stock_out_tool_spec_not_blank check (btrim(tool_spec) <> ''),
  constraint tooling_stock_out_material_not_blank check (btrim(material) <> ''),
  constraint tooling_stock_out_recipient_not_blank check (btrim(recipient) <> ''),
  constraint tooling_stock_out_purpose_not_blank check (btrim(purpose) <> ''),
  constraint tooling_stock_out_unit_price_non_negative check (unit_price >= 0::numeric),
  constraint tooling_stock_out_status_valid check (status in ('待审核', '已审核')),
  constraint tooling_stock_out_quantity_positive check (stock_out_quantity > 0::numeric)
);
comment on table public.tooling_stock_out is '刀具出库';
comment on column public.tooling_stock_out.tooling_data_id is '关联刀具资料 ID';
comment on column public.tooling_stock_out.tool_code is '刀具编号快照';
comment on column public.tooling_stock_out.tool_name is '刀具名称快照';
comment on column public.tooling_stock_out.tool_spec is '刀具规格快照';
comment on column public.tooling_stock_out.material is '材质快照';
comment on column public.tooling_stock_out.unit_price is '单价快照';
comment on column public.tooling_stock_out.recipient is '领用人';
comment on column public.tooling_stock_out.purpose is '用途';
comment on column public.tooling_stock_out.stock_out_date is '出库日期';
comment on column public.tooling_stock_out.status is '状态';
comment on column public.tooling_stock_out.stock_out_quantity is '出库数量';
comment on column public.tooling_stock_out.remarks is '备注';
create index if not exists idx_tooling_stock_out_tooling_data_id on public.tooling_stock_out (tooling_data_id);
create index if not exists idx_tooling_stock_out_status on public.tooling_stock_out (status);
create index if not exists idx_tooling_stock_out_date on public.tooling_stock_out (stock_out_date);
create index if not exists idx_tooling_stock_out_updated_at_desc on public.tooling_stock_out (updated_at desc);
drop trigger if exists update_tooling_stock_out_updated_at on public.tooling_stock_out;
create trigger update_tooling_stock_out_updated_at before
update on public.tooling_stock_out for each row execute function public.update_updated_at_column();
alter table public.tooling_stock_out enable row level security;
drop policy if exists "Tooling stock out admin all" on public.tooling_stock_out;
create policy "Tooling stock out admin all" on public.tooling_stock_out for all to authenticated using (public.is_admin()) with check (public.is_admin());
create or replace function public.ensure_tooling_inventory_row(
    target_tooling_data_id uuid,
    snapshot_tool_code text,
    snapshot_tool_name text,
    snapshot_tool_spec text,
    snapshot_material text,
    snapshot_unit_price numeric
  ) returns void language plpgsql as $$ begin
insert into public.tooling_inventory (
    tooling_data_id,
    tool_code,
    tool_name,
    tool_spec,
    material,
    unit_price
  )
values (
    target_tooling_data_id,
    snapshot_tool_code,
    snapshot_tool_name,
    snapshot_tool_spec,
    snapshot_material,
    snapshot_unit_price
  ) on conflict (tooling_data_id) do
update
set tool_code = excluded.tool_code,
  tool_name = excluded.tool_name,
  tool_spec = excluded.tool_spec,
  material = excluded.material,
  unit_price = excluded.unit_price,
  updated_at = now();
end;
$$;
create or replace function public.refresh_tooling_inventory_pending_stock_in(target_tooling_data_id uuid) returns void language plpgsql as $$ begin
update public.tooling_inventory
set pending_stock_in = coalesce(
    (
      select sum(stock_in_quantity)
      from public.tooling_stock_in
      where tooling_data_id = target_tooling_data_id
        and status = '待审核'
    ),
    0::numeric
  )
where tooling_data_id = target_tooling_data_id;
end;
$$;
create or replace function public.refresh_tooling_inventory_pending_stock_out(target_tooling_data_id uuid) returns void language plpgsql as $$ begin
update public.tooling_inventory
set pending_stock_out = coalesce(
    (
      select sum(stock_out_quantity)
      from public.tooling_stock_out
      where tooling_data_id = target_tooling_data_id
        and status = '待审核'
    ),
    0::numeric
  )
where tooling_data_id = target_tooling_data_id;
end;
$$;
create or replace function public.handle_tooling_stock_in_inventory_sync() returns trigger language plpgsql as $$ begin if tg_op = 'INSERT' then perform public.ensure_tooling_inventory_row(
    new.tooling_data_id,
    new.tool_code,
    new.tool_name,
    new.tool_spec,
    new.material,
    new.unit_price
  );
if new.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock + new.stock_in_quantity
where tooling_data_id = new.tooling_data_id;
end if;
perform public.refresh_tooling_inventory_pending_stock_in(new.tooling_data_id);
return new;
end if;
if tg_op = 'UPDATE' then if old.tooling_data_id <> new.tooling_data_id then perform public.ensure_tooling_inventory_row(
  new.tooling_data_id,
  new.tool_code,
  new.tool_name,
  new.tool_spec,
  new.material,
  new.unit_price
);
if old.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock - old.stock_in_quantity
where tooling_data_id = old.tooling_data_id;
end if;
if new.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock + new.stock_in_quantity
where tooling_data_id = new.tooling_data_id;
end if;
perform public.refresh_tooling_inventory_pending_stock_in(old.tooling_data_id);
perform public.refresh_tooling_inventory_pending_stock_in(new.tooling_data_id);
return new;
end if;
perform public.ensure_tooling_inventory_row(
  new.tooling_data_id,
  new.tool_code,
  new.tool_name,
  new.tool_spec,
  new.material,
  new.unit_price
);
if old.status = '已审核'
and new.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock + (new.stock_in_quantity - old.stock_in_quantity)
where tooling_data_id = new.tooling_data_id;
elsif old.status = '已审核'
and new.status <> '已审核' then
update public.tooling_inventory
set current_stock = current_stock - old.stock_in_quantity
where tooling_data_id = new.tooling_data_id;
elsif old.status <> '已审核'
and new.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock + new.stock_in_quantity
where tooling_data_id = new.tooling_data_id;
end if;
perform public.refresh_tooling_inventory_pending_stock_in(new.tooling_data_id);
return new;
end if;
if old.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock - old.stock_in_quantity
where tooling_data_id = old.tooling_data_id;
end if;
perform public.refresh_tooling_inventory_pending_stock_in(old.tooling_data_id);
return old;
end;
$$;
create or replace function public.apply_tooling_stock_out_audit(
    target_tooling_data_id uuid,
    target_stock_out_quantity numeric
  ) returns void language plpgsql as $$ begin
update public.tooling_inventory
set current_stock = current_stock - target_stock_out_quantity
where tooling_data_id = target_tooling_data_id
  and current_stock >= target_stock_out_quantity;
if not found then raise exception '刀具库存不足，无法审核出库';
end if;
end;
$$;
create or replace function public.handle_tooling_stock_out_inventory_sync() returns trigger language plpgsql as $$ begin if tg_op = 'INSERT' then perform public.ensure_tooling_inventory_row(
    new.tooling_data_id,
    new.tool_code,
    new.tool_name,
    new.tool_spec,
    new.material,
    new.unit_price
  );
if new.status = '已审核' then perform public.apply_tooling_stock_out_audit(new.tooling_data_id, new.stock_out_quantity);
end if;
perform public.refresh_tooling_inventory_pending_stock_out(new.tooling_data_id);
return new;
end if;
if tg_op = 'UPDATE' then if old.tooling_data_id <> new.tooling_data_id then perform public.ensure_tooling_inventory_row(
  new.tooling_data_id,
  new.tool_code,
  new.tool_name,
  new.tool_spec,
  new.material,
  new.unit_price
);
if old.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock + old.stock_out_quantity
where tooling_data_id = old.tooling_data_id;
end if;
if new.status = '已审核' then perform public.apply_tooling_stock_out_audit(new.tooling_data_id, new.stock_out_quantity);
end if;
perform public.refresh_tooling_inventory_pending_stock_out(old.tooling_data_id);
perform public.refresh_tooling_inventory_pending_stock_out(new.tooling_data_id);
return new;
end if;
perform public.ensure_tooling_inventory_row(
  new.tooling_data_id,
  new.tool_code,
  new.tool_name,
  new.tool_spec,
  new.material,
  new.unit_price
);
if old.status = '已审核'
and new.status = '已审核' then if new.stock_out_quantity > old.stock_out_quantity then perform public.apply_tooling_stock_out_audit(
  new.tooling_data_id,
  new.stock_out_quantity - old.stock_out_quantity
);
elsif new.stock_out_quantity < old.stock_out_quantity then
update public.tooling_inventory
set current_stock = current_stock + (old.stock_out_quantity - new.stock_out_quantity)
where tooling_data_id = new.tooling_data_id;
end if;
elsif old.status = '已审核'
and new.status <> '已审核' then
update public.tooling_inventory
set current_stock = current_stock + old.stock_out_quantity
where tooling_data_id = new.tooling_data_id;
elsif old.status <> '已审核'
and new.status = '已审核' then perform public.apply_tooling_stock_out_audit(new.tooling_data_id, new.stock_out_quantity);
end if;
perform public.refresh_tooling_inventory_pending_stock_out(new.tooling_data_id);
return new;
end if;
if old.status = '已审核' then
update public.tooling_inventory
set current_stock = current_stock + old.stock_out_quantity
where tooling_data_id = old.tooling_data_id;
end if;
perform public.refresh_tooling_inventory_pending_stock_out(old.tooling_data_id);
return old;
end;
$$;
create or replace function public.validate_tooling_stock_in_edit_rules() returns trigger language plpgsql as $$ begin if tg_op = 'UPDATE'
  and old.status = '已审核' then if new.tooling_data_id is distinct
from old.tooling_data_id
  or new.tool_code is distinct
from old.tool_code
  or new.tool_name is distinct
from old.tool_name
  or new.tool_spec is distinct
from old.tool_spec
  or new.material is distinct
from old.material
  or new.unit_price is distinct
from old.unit_price
  or new.stock_in_quantity is distinct
from old.stock_in_quantity then raise exception '已审核的刀具入库仅允许修改备注，审核与反审请使用页面顶部按钮';
end if;
end if;
return new;
end;
$$;
create or replace function public.validate_tooling_stock_out_edit_rules() returns trigger language plpgsql as $$ begin if tg_op = 'UPDATE'
  and old.status = '已审核' then if new.tooling_data_id is distinct
from old.tooling_data_id
  or new.tool_code is distinct
from old.tool_code
  or new.tool_name is distinct
from old.tool_name
  or new.tool_spec is distinct
from old.tool_spec
  or new.material is distinct
from old.material
  or new.unit_price is distinct
from old.unit_price
  or new.recipient is distinct
from old.recipient
  or new.purpose is distinct
from old.purpose
  or new.stock_out_date is distinct
from old.stock_out_date
  or new.stock_out_quantity is distinct
from old.stock_out_quantity then raise exception '已审核的刀具出库仅允许修改备注，审核与反审请使用页面顶部按钮';
end if;
end if;
return new;
end;
$$;
create or replace function public.prevent_delete_audited_tooling_stock_in() returns trigger language plpgsql as $$ begin if old.status = '已审核' then raise exception '已审核的刀具入库不允许删除';
end if;
return old;
end;
$$;
create or replace function public.prevent_delete_audited_tooling_stock_out() returns trigger language plpgsql as $$ begin if old.status = '已审核' then raise exception '已审核的刀具出库不允许删除';
end if;
return old;
end;
$$;
drop trigger if exists validate_tooling_stock_in_edit_rules on public.tooling_stock_in;
create trigger validate_tooling_stock_in_edit_rules before
update on public.tooling_stock_in for each row execute function public.validate_tooling_stock_in_edit_rules();
drop trigger if exists prevent_delete_audited_tooling_stock_in on public.tooling_stock_in;
create trigger prevent_delete_audited_tooling_stock_in before delete on public.tooling_stock_in for each row execute function public.prevent_delete_audited_tooling_stock_in();
drop trigger if exists sync_tooling_stock_in_inventory on public.tooling_stock_in;
create trigger sync_tooling_stock_in_inventory
after
insert
  or
update
  or delete on public.tooling_stock_in for each row execute function public.handle_tooling_stock_in_inventory_sync();
drop trigger if exists validate_tooling_stock_out_edit_rules on public.tooling_stock_out;
create trigger validate_tooling_stock_out_edit_rules before
update on public.tooling_stock_out for each row execute function public.validate_tooling_stock_out_edit_rules();
drop trigger if exists prevent_delete_audited_tooling_stock_out on public.tooling_stock_out;
create trigger prevent_delete_audited_tooling_stock_out before delete on public.tooling_stock_out for each row execute function public.prevent_delete_audited_tooling_stock_out();
drop trigger if exists sync_tooling_stock_out_inventory on public.tooling_stock_out;
create trigger sync_tooling_stock_out_inventory
after
insert
  or
update
  or delete on public.tooling_stock_out for each row execute function public.handle_tooling_stock_out_inventory_sync();
insert into public.permissions (key, scope, module, surface, label)
values (
    'page:tooling-inventory',
    'page',
    'consumables',
    'pc',
    '刀具库存'
  ),
  (
    'page:tooling-stock-in',
    'page',
    'consumables',
    'pc',
    '刀具入库'
  ),
  (
    'page:tooling-stock-out',
    'page',
    'consumables',
    'pc',
    '刀具出库'
  ) on conflict (key) do
update
set scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label;
insert into public.role_permissions (role, permission_id)
select 'admin',
  id
from public.permissions
where key in (
    'page:tooling-inventory',
    'page:tooling-stock-in',
    'page:tooling-stock-out'
  ) on conflict (role, permission_id) do nothing;