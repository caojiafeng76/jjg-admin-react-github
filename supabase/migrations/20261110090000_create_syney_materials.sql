-- ============================================================
-- 西尼材料库存
--   syney_materials_data                  材料资料（品名 + 规格 唯一）
--   syney_materials_inventory             材料库存，与资料一对一，资料新增时自动建 0 库存行
--   syney_materials_stock_in / _stock_out 出入库流水，触发器同事务加减库存
--   syney_materials_inventory_adjustments 直接改库存数量时由触发器写入的调整流水
--   get_syney_materials_monthly_report    月度报表：上月结余 / 本月入库 / 出库 / 调整 / 月末结存
-- 结构与金檀木业型材一致，字段为 品名、规格、单位、数量、备注
-- ============================================================

-- 1. 材料资料
create table public.syney_materials_data (
  id            uuid primary key default gen_random_uuid(),
  material_name text not null,
  specification text not null default '',
  unit          text not null default '',
  remarks       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint syney_materials_data_name_not_blank check (btrim(material_name) <> ''),
  constraint syney_materials_data_unit_not_blank check (btrim(unit) <> ''),
  constraint syney_materials_data_name_spec_unique unique (material_name, specification)
);

comment on table public.syney_materials_data is '西尼材料资料';
comment on column public.syney_materials_data.material_name is '品名';
comment on column public.syney_materials_data.specification is '规格';
comment on column public.syney_materials_data.unit is '单位';
comment on column public.syney_materials_data.remarks is '备注';

create index idx_syney_materials_data_updated_at_desc
  on public.syney_materials_data (updated_at desc);

create trigger update_syney_materials_data_updated_at
before update on public.syney_materials_data
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.syney_materials_data
for each row execute function public.prevent_viewer_dml();

-- 2. 材料库存
create table public.syney_materials_inventory (
  id               uuid primary key default gen_random_uuid(),
  material_data_id uuid not null references public.syney_materials_data (id) on update cascade on delete cascade,
  material_name    text not null,
  specification    text not null default '',
  unit             text not null default '',
  quantity         integer not null default 0,
  remarks          text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint syney_materials_inventory_name_not_blank check (btrim(material_name) <> ''),
  constraint syney_materials_inventory_quantity_non_negative check (quantity >= 0),
  constraint syney_materials_inventory_data_unique unique (material_data_id)
);

comment on table public.syney_materials_inventory is '西尼材料库存';
comment on column public.syney_materials_inventory.material_data_id is '关联材料资料 ID';
comment on column public.syney_materials_inventory.material_name is '品名快照';
comment on column public.syney_materials_inventory.specification is '规格快照';
comment on column public.syney_materials_inventory.unit is '单位快照';
comment on column public.syney_materials_inventory.quantity is '库存数量';
comment on column public.syney_materials_inventory.remarks is '备注';

create index idx_syney_materials_inventory_updated_at_desc
  on public.syney_materials_inventory (updated_at desc);

create trigger update_syney_materials_inventory_updated_at
before update on public.syney_materials_inventory
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.syney_materials_inventory
for each row execute function public.prevent_viewer_dml();

-- 资料新增时建库存行，品名/规格/单位变更时同步快照。
-- security definer：只有资料页权限的用户也能新建资料，不被库存表 RLS 拦截。
create function public.handle_syney_materials_data_inventory_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.syney_materials_inventory (
      material_data_id, material_name, specification, unit
    )
    values (new.id, new.material_name, new.specification, new.unit)
    on conflict (material_data_id) do nothing;
    return new;
  end if;

  update public.syney_materials_inventory
  set material_name = new.material_name,
      specification = new.specification,
      unit = new.unit
  where material_data_id = new.id
    and (material_name, specification, unit)
      is distinct from (new.material_name, new.specification, new.unit);

  return new;
end;
$$;

revoke all on function public.handle_syney_materials_data_inventory_sync() from public;

create trigger syney_materials_data_inventory_sync
after insert or update of material_name, specification, unit on public.syney_materials_data
for each row execute function public.handle_syney_materials_data_inventory_sync();

-- 3. 入库流水
create table public.syney_materials_stock_in (
  id            uuid primary key default gen_random_uuid(),
  inventory_id  uuid not null references public.syney_materials_inventory (id) on delete restrict,
  material_name text not null default '',
  specification text not null default '',
  unit          text not null default '',
  quantity      integer not null check (quantity > 0),
  remarks       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.syney_materials_stock_in is '西尼材料入库流水';
comment on column public.syney_materials_stock_in.inventory_id is '关联材料库存 ID';
comment on column public.syney_materials_stock_in.quantity is '入库数量，正整数';

create index idx_syney_materials_stock_in_created_at_desc
  on public.syney_materials_stock_in (created_at desc);
create index idx_syney_materials_stock_in_inventory_id
  on public.syney_materials_stock_in (inventory_id);

create trigger update_syney_materials_stock_in_updated_at
before update on public.syney_materials_stock_in
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.syney_materials_stock_in
for each row execute function public.prevent_viewer_dml();

-- 快照由数据库填写，客户端不能伪造材料资料。写入库存与流水处于同一事务。
create function public.handle_syney_materials_stock_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select material_name, specification, unit
      into new.material_name, new.specification, new.unit
    from public.syney_materials_inventory
    where id = new.inventory_id;

    if not found then
      raise exception '材料库存不存在，无法入库';
    end if;

    update public.syney_materials_inventory
    set quantity = quantity + new.quantity
    where id = new.inventory_id;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.material_name, new.specification,
        new.unit, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.material_name, old.specification,
        old.unit, old.quantity, old.created_at) then
      raise exception '入库记录仅允许修改备注';
    end if;
    return new;
  end if;

  update public.syney_materials_inventory
  set quantity = quantity - old.quantity
  where id = old.inventory_id and quantity >= old.quantity;

  if not found then
    raise exception '当前库存不足，无法删除该入库记录';
  end if;
  return old;
end;
$$;

revoke all on function public.handle_syney_materials_stock_in() from public;

create trigger syney_materials_stock_in_apply
before insert or update or delete on public.syney_materials_stock_in
for each row execute function public.handle_syney_materials_stock_in();

-- 4. 出库流水
create table public.syney_materials_stock_out (
  id            uuid primary key default gen_random_uuid(),
  inventory_id  uuid not null references public.syney_materials_inventory (id) on delete restrict,
  material_name text not null default '',
  specification text not null default '',
  unit          text not null default '',
  quantity      integer not null check (quantity > 0),
  remarks       text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.syney_materials_stock_out is '西尼材料出库流水';
comment on column public.syney_materials_stock_out.inventory_id is '关联材料库存 ID';
comment on column public.syney_materials_stock_out.quantity is '出库数量，正整数';

create index idx_syney_materials_stock_out_created_at_desc
  on public.syney_materials_stock_out (created_at desc);
create index idx_syney_materials_stock_out_inventory_id
  on public.syney_materials_stock_out (inventory_id);

create trigger update_syney_materials_stock_out_updated_at
before update on public.syney_materials_stock_out
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.syney_materials_stock_out
for each row execute function public.prevent_viewer_dml();

-- 快照由数据库填写，客户端不能伪造材料资料。扣减库存与流水处于同一事务。
create function public.handle_syney_materials_stock_out()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select material_name, specification, unit
      into new.material_name, new.specification, new.unit
    from public.syney_materials_inventory
    where id = new.inventory_id;

    if not found then
      raise exception '材料库存不存在，无法出库';
    end if;

    update public.syney_materials_inventory
    set quantity = quantity - new.quantity
    where id = new.inventory_id and quantity >= new.quantity;

    if not found then
      raise exception '当前库存不足，无法出库';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.material_name, new.specification,
        new.unit, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.material_name, old.specification,
        old.unit, old.quantity, old.created_at) then
      raise exception '出库记录仅允许修改备注';
    end if;
    return new;
  end if;

  update public.syney_materials_inventory
  set quantity = quantity + old.quantity
  where id = old.inventory_id;

  if not found then
    raise exception '材料库存不存在，无法回补库存';
  end if;
  return old;
end;
$$;

revoke all on function public.handle_syney_materials_stock_out() from public;

create trigger syney_materials_stock_out_apply
before insert or update or delete on public.syney_materials_stock_out
for each row execute function public.handle_syney_materials_stock_out();

-- 5. 库存调整流水：库存页编辑、Excel 导入、详情抽屉调整等直接改数时写入
--    出入库单引起的库存变化已有流水，不重复记录；审计记录不设外键，资料删除后保留
create table public.syney_materials_inventory_adjustments (
  id              uuid primary key default gen_random_uuid(),
  inventory_id    uuid not null,
  material_name   text not null default '',
  specification   text not null default '',
  unit            text not null default '',
  quantity_before integer not null,
  quantity_after  integer not null,
  difference      integer generated always as (quantity_after - quantity_before) stored,
  remarks         text not null default '',
  operator_name   text not null default '',
  created_at      timestamptz not null default now()
);

comment on table public.syney_materials_inventory_adjustments is '西尼材料库存调整流水（直接改数时由触发器写入）';
comment on column public.syney_materials_inventory_adjustments.inventory_id is '材料库存行 ID';
comment on column public.syney_materials_inventory_adjustments.difference is '差额 = 调整后 - 调整前';
comment on column public.syney_materials_inventory_adjustments.operator_name is '操作人姓名快照，非员工账号或后台操作时为空';

create index idx_syney_materials_adjustments_inventory_created_at
  on public.syney_materials_inventory_adjustments (inventory_id, created_at desc);
create index idx_syney_materials_adjustments_created_at
  on public.syney_materials_inventory_adjustments (created_at);

create function public.record_syney_materials_inventory_adjustment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 出入库单在自己的触发器里改库存（深度 2），已有流水
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  insert into public.syney_materials_inventory_adjustments (
    inventory_id, material_name, specification, unit,
    quantity_before, quantity_after, remarks, operator_name
  )
  values (
    new.id,
    new.material_name,
    new.specification,
    new.unit,
    old.quantity,
    new.quantity,
    new.remarks,
    coalesce(
      (select e.name from public.employees e where e.auth_user_id = auth.uid() limit 1),
      ''
    )
  );

  return null;
end;
$$;

revoke all on function public.record_syney_materials_inventory_adjustment() from public;

create trigger syney_materials_inventory_record_adjustment
after update of quantity on public.syney_materials_inventory
for each row
when (old.quantity is distinct from new.quantity)
execute function public.record_syney_materials_inventory_adjustment();

-- 6. 表权限与 RLS
alter table public.syney_materials_data enable row level security;
alter table public.syney_materials_inventory enable row level security;
alter table public.syney_materials_stock_in enable row level security;
alter table public.syney_materials_stock_out enable row level security;
alter table public.syney_materials_inventory_adjustments enable row level security;

revoke all on public.syney_materials_data from anon, authenticated;
revoke all on public.syney_materials_inventory from anon, authenticated;
revoke all on public.syney_materials_stock_in from anon, authenticated;
revoke all on public.syney_materials_stock_out from anon, authenticated;
revoke all on public.syney_materials_inventory_adjustments from anon, authenticated;

grant select, insert, update, delete on public.syney_materials_data to authenticated;
grant select, insert, update, delete on public.syney_materials_inventory to authenticated;
grant select, insert, update, delete on public.syney_materials_stock_in to authenticated;
grant select, insert, update, delete on public.syney_materials_stock_out to authenticated;
grant select on public.syney_materials_inventory_adjustments to authenticated;

create policy "Syney materials data admin all"
on public.syney_materials_data for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Syney materials data permission rw"
on public.syney_materials_data for all to authenticated
using (public.current_user_has_permission('page:syney-materials-data'))
with check (public.current_user_has_permission('page:syney-materials-data'));

create policy "Syney materials inventory admin all"
on public.syney_materials_inventory for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Syney materials inventory permission rw"
on public.syney_materials_inventory for all to authenticated
using (public.current_user_has_permission('page:syney-materials-inventory'))
with check (public.current_user_has_permission('page:syney-materials-inventory'));

create policy "Syney materials inventory select for stock in"
on public.syney_materials_inventory for select to authenticated
using (public.current_user_has_permission('page:syney-materials-stock-in'));

create policy "Syney materials inventory select for stock out"
on public.syney_materials_inventory for select to authenticated
using (public.current_user_has_permission('page:syney-materials-stock-out'));

create policy "Syney materials stock in admin all"
on public.syney_materials_stock_in for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Syney materials stock in permission rw"
on public.syney_materials_stock_in for all to authenticated
using (public.current_user_has_permission('page:syney-materials-stock-in'))
with check (public.current_user_has_permission('page:syney-materials-stock-in'));

create policy "Syney materials stock out admin all"
on public.syney_materials_stock_out for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Syney materials stock out permission rw"
on public.syney_materials_stock_out for all to authenticated
using (public.current_user_has_permission('page:syney-materials-stock-out'))
with check (public.current_user_has_permission('page:syney-materials-stock-out'));

create policy "Syney materials adjustments select"
on public.syney_materials_inventory_adjustments for select to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:syney-materials-inventory')
);

-- 7. 月度报表
--   上月结余 = 当前库存 - 月初起（入库 - 出库 + 调整）合计
--   月末结存 = 上月结余 + 本月入库 - 本月出库 + 本月调整
create function public.get_syney_materials_monthly_report(p_month date)
returns table (
  inventory_id uuid,
  material_name text,
  specification text,
  unit text,
  opening_quantity bigint,
  stock_in_quantity bigint,
  stock_out_quantity bigint,
  stock_adjust_quantity bigint,
  closing_quantity bigint,
  current_quantity bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_start timestamptz;
  v_end timestamptz;
begin
  if not (
    public.is_admin()
    or public.current_user_has_permission('page:syney-materials-monthly-report')
  ) then
    raise exception '无权查看西尼材料月度报表' using errcode = '42501';
  end if;

  if p_month is null then
    raise exception '请选择报表月份' using errcode = '22004';
  end if;

  v_start := date_trunc('month', p_month)::timestamp at time zone 'Asia/Shanghai';
  v_end := (date_trunc('month', p_month) + interval '1 month')::timestamp at time zone 'Asia/Shanghai';

  return query
  with movements as (
    select s.inventory_id, s.quantity, 'in'::text as kind, s.created_at
    from public.syney_materials_stock_in s
    where s.created_at >= v_start
    union all
    select s.inventory_id, s.quantity, 'out', s.created_at
    from public.syney_materials_stock_out s
    where s.created_at >= v_start
    union all
    select a.inventory_id, a.difference, 'adjust', a.created_at
    from public.syney_materials_inventory_adjustments a
    where a.created_at >= v_start
  ),
  movement_totals as (
    select
      m.inventory_id,
      coalesce(sum(case when m.kind = 'out' then -m.quantity else m.quantity end), 0)::bigint as net_since_start,
      coalesce(sum(m.quantity) filter (where m.kind = 'in' and m.created_at < v_end), 0)::bigint as month_in,
      coalesce(sum(m.quantity) filter (where m.kind = 'out' and m.created_at < v_end), 0)::bigint as month_out,
      coalesce(sum(m.quantity) filter (where m.kind = 'adjust' and m.created_at < v_end), 0)::bigint as month_adjust
    from movements m
    group by m.inventory_id
  )
  select
    i.id,
    i.material_name,
    i.specification,
    i.unit,
    i.quantity::bigint - coalesce(t.net_since_start, 0) as opening_quantity,
    coalesce(t.month_in, 0) as stock_in_quantity,
    coalesce(t.month_out, 0) as stock_out_quantity,
    coalesce(t.month_adjust, 0) as stock_adjust_quantity,
    i.quantity::bigint - coalesce(t.net_since_start, 0)
      + coalesce(t.month_in, 0) - coalesce(t.month_out, 0)
      + coalesce(t.month_adjust, 0) as closing_quantity,
    i.quantity::bigint as current_quantity
  from public.syney_materials_inventory i
  left join movement_totals t on t.inventory_id = i.id
  order by i.material_name, i.specification;
end;
$$;

comment on function public.get_syney_materials_monthly_report(date) is
  '西尼材料月度库存报表：按 Asia/Shanghai 月份返回上月结余、本月入库、本月出库、本月调整、月末结存';

revoke all on function public.get_syney_materials_monthly_report(date) from public, anon;
grant execute on function public.get_syney_materials_monthly_report(date) to authenticated;

-- 8. 权限
insert into public.permissions (key, scope, module, surface, label)
values
  ('nav:syney-materials', 'nav', 'syney-materials', 'pc', '西尼材料库存菜单分组'),
  ('page:syney-materials-data', 'page', 'syney-materials', 'pc', '西尼材料资料'),
  ('page:syney-materials-stock-in', 'page', 'syney-materials', 'pc', '西尼材料入库'),
  ('page:syney-materials-stock-out', 'page', 'syney-materials', 'pc', '西尼材料出库'),
  ('page:syney-materials-inventory', 'page', 'syney-materials', 'pc', '西尼材料库存'),
  ('page:syney-materials-monthly-report', 'page', 'syney-materials', 'pc', '西尼材料月度报表')
on conflict (key) do nothing;
