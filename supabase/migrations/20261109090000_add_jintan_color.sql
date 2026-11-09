-- ============================================================
-- 金檀木业配件、型材增加颜色字段
--   color  自由文本、选填，默认空字符串，已有数据为空
--   颜色参与判重：同一「类型+(型号)+名称+规格」可按颜色分多条资料，库存与出入库分开记账
--   库存、出入库、调整流水保存颜色快照，月度报表返回颜色（素材为空字符串）
-- ============================================================

-- 1. 字段
alter table public.jintan_parts_data add column color text not null default '';
alter table public.jintan_parts_inventory add column color text not null default '';
alter table public.jintan_parts_stock_in add column color text not null default '';
alter table public.jintan_parts_stock_out add column color text not null default '';
alter table public.jintan_profiles_data add column color text not null default '';
alter table public.jintan_profiles_inventory add column color text not null default '';
alter table public.jintan_profiles_stock_in add column color text not null default '';
alter table public.jintan_profiles_stock_out add column color text not null default '';
alter table public.jintan_inventory_adjustments add column item_color text not null default '';

comment on column public.jintan_parts_data.color is '颜色，选填';
comment on column public.jintan_parts_inventory.color is '颜色快照';
comment on column public.jintan_parts_stock_in.color is '颜色快照';
comment on column public.jintan_parts_stock_out.color is '颜色快照';
comment on column public.jintan_profiles_data.color is '颜色，选填';
comment on column public.jintan_profiles_inventory.color is '颜色快照';
comment on column public.jintan_profiles_stock_in.color is '颜色快照';
comment on column public.jintan_profiles_stock_out.color is '颜色快照';
comment on column public.jintan_inventory_adjustments.item_color is '颜色快照，素材为空字符串';

-- 2. 判重：加上颜色
alter table public.jintan_parts_data
  drop constraint jintan_parts_data_type_name_spec_unique,
  add constraint jintan_parts_data_type_name_spec_color_unique
    unique (item_type, part_name, specification, color);

alter table public.jintan_profiles_data
  drop constraint jintan_profiles_data_type_model_name_spec_unique,
  add constraint jintan_profiles_data_type_model_name_spec_color_unique
    unique (item_type, profile_model, profile_name, specification, color);

-- 3. 资料 -> 库存同步
create or replace function public.handle_jintan_parts_data_inventory_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.jintan_parts_inventory (
      part_data_id,
      item_type,
      part_name,
      specification,
      color,
      material,
      supplier
    )
    values (
      new.id,
      new.item_type,
      new.part_name,
      new.specification,
      new.color,
      new.material,
      new.supplier
    )
    on conflict (part_data_id) do nothing;
    return new;
  end if;

  update public.jintan_parts_inventory
  set item_type = new.item_type,
      part_name = new.part_name,
      specification = new.specification,
      color = new.color,
      material = new.material,
      supplier = new.supplier
  where part_data_id = new.id
    and (item_type, part_name, specification, color, material, supplier)
      is distinct from (new.item_type, new.part_name, new.specification, new.color, new.material, new.supplier);

  return new;
end;
$$;

drop trigger jintan_parts_data_inventory_sync on public.jintan_parts_data;
create trigger jintan_parts_data_inventory_sync
after insert or update of item_type, part_name, specification, color, material, supplier on public.jintan_parts_data
for each row execute function public.handle_jintan_parts_data_inventory_sync();

create or replace function public.handle_jintan_profiles_data_inventory_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.jintan_profiles_inventory (
      profile_data_id,
      item_type,
      profile_model,
      profile_name,
      specification,
      color,
      material
    )
    values (
      new.id,
      new.item_type,
      new.profile_model,
      new.profile_name,
      new.specification,
      new.color,
      new.material
    )
    on conflict (profile_data_id) do nothing;
    return new;
  end if;

  update public.jintan_profiles_inventory
  set item_type = new.item_type,
      profile_model = new.profile_model,
      profile_name = new.profile_name,
      specification = new.specification,
      color = new.color,
      material = new.material
  where profile_data_id = new.id
    and (item_type, profile_model, profile_name, specification, color, material)
      is distinct from (new.item_type, new.profile_model, new.profile_name, new.specification, new.color, new.material);

  return new;
end;
$$;

drop trigger jintan_profiles_data_inventory_sync on public.jintan_profiles_data;
create trigger jintan_profiles_data_inventory_sync
after insert or update of item_type, profile_model, profile_name, specification, color, material on public.jintan_profiles_data
for each row execute function public.handle_jintan_profiles_data_inventory_sync();

-- 4. 出入库快照：由数据库填写，且只允许修改备注（公开扫码出库走同一个触发器）
create or replace function public.handle_jintan_parts_stock_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select item_type, part_name, specification, color, material, supplier
      into new.item_type, new.part_name, new.specification, new.color, new.material, new.supplier
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
    if (new.id, new.inventory_id, new.item_type, new.part_name, new.specification, new.color,
        new.material, new.supplier, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.item_type, old.part_name, old.specification, old.color,
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

create or replace function public.handle_jintan_parts_stock_out()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select item_type, part_name, specification, color, material, supplier
      into new.item_type, new.part_name, new.specification, new.color, new.material, new.supplier
    from public.jintan_parts_inventory
    where id = new.inventory_id;

    if not found then
      raise exception '配件库存不存在，无法出库';
    end if;

    update public.jintan_parts_inventory
    set quantity = quantity - new.quantity
    where id = new.inventory_id and quantity >= new.quantity;

    if not found then
      raise exception '当前库存不足，无法出库';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.item_type, new.part_name, new.specification, new.color,
        new.material, new.supplier, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.item_type, old.part_name, old.specification, old.color,
        old.material, old.supplier, old.quantity, old.created_at) then
      raise exception '出库记录仅允许修改备注';
    end if;
    return new;
  end if;

  update public.jintan_parts_inventory
  set quantity = quantity + old.quantity
  where id = old.inventory_id;

  if not found then
    raise exception '配件库存不存在，无法回补库存';
  end if;
  return old;
end;
$$;

create or replace function public.handle_jintan_profiles_stock_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select item_type, profile_model, profile_name, specification, color, material
      into new.item_type, new.profile_model, new.profile_name, new.specification, new.color, new.material
    from public.jintan_profiles_inventory
    where id = new.inventory_id;

    if not found then
      raise exception '型材库存不存在，无法入库';
    end if;

    update public.jintan_profiles_inventory
    set quantity = quantity + new.quantity
    where id = new.inventory_id;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.item_type, new.profile_model, new.profile_name,
        new.specification, new.color, new.material, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.item_type, old.profile_model, old.profile_name,
        old.specification, old.color, old.material, old.quantity, old.created_at) then
      raise exception '入库记录仅允许修改备注';
    end if;
    return new;
  end if;

  update public.jintan_profiles_inventory
  set quantity = quantity - old.quantity
  where id = old.inventory_id and quantity >= old.quantity;

  if not found then
    raise exception '当前库存不足，无法删除该入库记录';
  end if;
  return old;
end;
$$;

create or replace function public.handle_jintan_profiles_stock_out()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select item_type, profile_model, profile_name, specification, color, material
      into new.item_type, new.profile_model, new.profile_name, new.specification, new.color, new.material
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
    if (new.id, new.inventory_id, new.item_type, new.profile_model, new.profile_name,
        new.specification, new.color, new.material, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.item_type, old.profile_model, old.profile_name,
        old.specification, old.color, old.material, old.quantity, old.created_at) then
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

-- 5. 库存调整流水：记录颜色快照（素材为空字符串）
create or replace function public.record_jintan_inventory_adjustment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(new);
begin
  -- 出入库单在自己的触发器里改库存（深度 2），已有流水
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  insert into public.jintan_inventory_adjustments (
    category, inventory_id, item_type, item_model, item_name, specification, item_color, material,
    quantity_before, quantity_after, remarks, operator_name
  )
  values (
    tg_argv[0],
    new.id,
    coalesce(v_row ->> 'item_type', ''),
    coalesce(v_row ->> 'profile_model', v_row ->> 'material_model', ''),
    coalesce(v_row ->> 'part_name', v_row ->> 'profile_name', v_row ->> 'material_name', ''),
    coalesce(v_row ->> 'specification', ''),
    coalesce(v_row ->> 'color', ''),
    coalesce(v_row ->> 'material', ''),
    old.quantity,
    new.quantity,
    coalesce(v_row ->> 'remarks', ''),
    coalesce(
      (select e.name from public.employees e where e.auth_user_id = auth.uid() limit 1),
      ''
    )
  );

  return null;
end;
$$;

-- 6. 月度报表：返回列新增 item_color，需先删除再重建
drop function if exists public.get_jintan_monthly_inventory_report(date);

create function public.get_jintan_monthly_inventory_report(p_month date)
returns table (
  category text,
  inventory_id uuid,
  item_type text,
  item_model text,
  item_name text,
  specification text,
  item_color text,
  material text,
  supplier text,
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
    or public.current_user_has_permission('page:jintan-monthly-report')
  ) then
    raise exception '无权查看金檀月度报表' using errcode = '42501';
  end if;

  if p_month is null then
    raise exception '请选择报表月份' using errcode = '22004';
  end if;

  v_start := date_trunc('month', p_month)::timestamp at time zone 'Asia/Shanghai';
  v_end := (date_trunc('month', p_month) + interval '1 month')::timestamp at time zone 'Asia/Shanghai';

  return query
  with movements as (
    select 'parts'::text as category, s.inventory_id, s.quantity, 'in'::text as kind, s.created_at
    from public.jintan_parts_stock_in s
    where s.created_at >= v_start
    union all
    select 'parts', s.inventory_id, s.quantity, 'out', s.created_at
    from public.jintan_parts_stock_out s
    where s.created_at >= v_start
    union all
    select 'profiles', s.inventory_id, s.quantity, 'in', s.created_at
    from public.jintan_profiles_stock_in s
    where s.created_at >= v_start
    union all
    select 'profiles', s.inventory_id, s.quantity, 'out', s.created_at
    from public.jintan_profiles_stock_out s
    where s.created_at >= v_start
    union all
    select 'materials', s.inventory_id, s.quantity, 'in', s.created_at
    from public.jintan_materials_stock_in s
    where s.created_at >= v_start
    union all
    select 'materials', s.inventory_id, s.quantity, 'out', s.created_at
    from public.jintan_materials_stock_out s
    where s.created_at >= v_start
    union all
    select a.category, a.inventory_id, a.difference, 'adjust', a.created_at
    from public.jintan_inventory_adjustments a
    where a.created_at >= v_start
  ),
  movement_totals as (
    select
      m.category,
      m.inventory_id,
      coalesce(sum(case when m.kind = 'out' then -m.quantity else m.quantity end), 0)::bigint as net_since_start,
      coalesce(sum(m.quantity) filter (where m.kind = 'in' and m.created_at < v_end), 0)::bigint as month_in,
      coalesce(sum(m.quantity) filter (where m.kind = 'out' and m.created_at < v_end), 0)::bigint as month_out,
      coalesce(sum(m.quantity) filter (where m.kind = 'adjust' and m.created_at < v_end), 0)::bigint as month_adjust
    from movements m
    group by m.category, m.inventory_id
  ),
  items as (
    select 1 as category_rank, 'parts'::text as category, i.id as inventory_id,
      i.item_type, ''::text as item_model, i.part_name as item_name, i.specification,
      i.color as item_color, i.material, i.supplier, i.quantity::bigint as current_quantity
    from public.jintan_parts_inventory i
    union all
    select 2, 'profiles', i.id, i.item_type, i.profile_model, i.profile_name, i.specification,
      i.color, i.material, ''::text, i.quantity::bigint
    from public.jintan_profiles_inventory i
    union all
    select 3, 'materials', i.id, i.item_type, i.material_model, i.material_name, i.specification,
      ''::text, i.material, ''::text, i.quantity::bigint
    from public.jintan_materials_inventory i
  )
  select
    it.category,
    it.inventory_id,
    it.item_type,
    it.item_model,
    it.item_name,
    it.specification,
    it.item_color,
    it.material,
    it.supplier,
    it.current_quantity - coalesce(t.net_since_start, 0) as opening_quantity,
    coalesce(t.month_in, 0) as stock_in_quantity,
    coalesce(t.month_out, 0) as stock_out_quantity,
    coalesce(t.month_adjust, 0) as stock_adjust_quantity,
    it.current_quantity - coalesce(t.net_since_start, 0)
      + coalesce(t.month_in, 0) - coalesce(t.month_out, 0)
      + coalesce(t.month_adjust, 0) as closing_quantity,
    it.current_quantity
  from items it
  left join movement_totals t
    on t.category = it.category and t.inventory_id = it.inventory_id
  order by it.category_rank, it.item_model, it.item_name, it.specification, it.item_color, it.item_type;
end;
$$;

comment on function public.get_jintan_monthly_inventory_report(date) is
  '金檀木业月度库存报表：按 Asia/Shanghai 月份返回配件/型材/素材的类型、颜色、上月结余、本月入库、本月出库、本月调整、月末结存';

revoke all on function public.get_jintan_monthly_inventory_report(date) from public, anon;
grant execute on function public.get_jintan_monthly_inventory_report(date) to authenticated;
