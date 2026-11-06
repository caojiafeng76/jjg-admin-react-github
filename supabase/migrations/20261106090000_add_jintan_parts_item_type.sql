-- ============================================================
-- 金檀木业配件增加类型字段（A / B）
--   item_type  默认 A，已有数据归为 A
--   同一「名称+规格」可同时存在 A、B 两条资料，库存与出入库分开记账
--   安全库存在库存行上，A、B 各自独立
--   月度报表的配件改为返回真实类型
-- ============================================================

-- 1. 字段：常量默认值把已有行填为 A
alter table public.jintan_parts_data
  add column item_type text not null default 'A'
  constraint jintan_parts_data_item_type_check check (item_type in ('A', 'B'));
alter table public.jintan_parts_inventory
  add column item_type text not null default 'A'
  constraint jintan_parts_inventory_item_type_check check (item_type in ('A', 'B'));
alter table public.jintan_parts_stock_in
  add column item_type text not null default 'A'
  constraint jintan_parts_stock_in_item_type_check check (item_type in ('A', 'B'));
alter table public.jintan_parts_stock_out
  add column item_type text not null default 'A'
  constraint jintan_parts_stock_out_item_type_check check (item_type in ('A', 'B'));

comment on column public.jintan_parts_data.item_type is '类型：A / B';
comment on column public.jintan_parts_inventory.item_type is '类型快照';
comment on column public.jintan_parts_stock_in.item_type is '类型快照';
comment on column public.jintan_parts_stock_out.item_type is '类型快照';

-- 2. 判重：类型 + 名称 + 规格
alter table public.jintan_parts_data
  drop constraint jintan_parts_data_name_spec_unique,
  add constraint jintan_parts_data_type_name_spec_unique
    unique (item_type, part_name, specification);

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
      material,
      supplier
    )
    values (
      new.id,
      new.item_type,
      new.part_name,
      new.specification,
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
      material = new.material,
      supplier = new.supplier
  where part_data_id = new.id
    and (item_type, part_name, specification, material, supplier)
      is distinct from (new.item_type, new.part_name, new.specification, new.material, new.supplier);

  return new;
end;
$$;

drop trigger jintan_parts_data_inventory_sync on public.jintan_parts_data;
create trigger jintan_parts_data_inventory_sync
after insert or update of item_type, part_name, specification, material, supplier on public.jintan_parts_data
for each row execute function public.handle_jintan_parts_data_inventory_sync();

-- 4. 出入库快照：由数据库填写，且只允许修改备注（公开扫码出库走同一个触发器）
create or replace function public.handle_jintan_parts_stock_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select item_type, part_name, specification, material, supplier
      into new.item_type, new.part_name, new.specification, new.material, new.supplier
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
    if (new.id, new.inventory_id, new.item_type, new.part_name, new.specification,
        new.material, new.supplier, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.item_type, old.part_name, old.specification,
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
    select item_type, part_name, specification, material, supplier
      into new.item_type, new.part_name, new.specification, new.material, new.supplier
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
    if (new.id, new.inventory_id, new.item_type, new.part_name, new.specification,
        new.material, new.supplier, new.quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.item_type, old.part_name, old.specification,
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

-- 5. 库存调整流水：触发器已读取 item_type，这里只回填已有配件行
update public.jintan_inventory_adjustments
set item_type = 'A'
where category = 'parts';

comment on column public.jintan_inventory_adjustments.item_type is '类型快照：A / B';

-- 6. 月度报表：配件返回真实类型。返回列不变，可直接替换
create or replace function public.get_jintan_monthly_inventory_report(p_month date)
returns table (
  category text,
  inventory_id uuid,
  item_type text,
  item_model text,
  item_name text,
  specification text,
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
      i.item_type, ''::text as item_model, i.part_name as item_name, i.specification, i.material,
      i.supplier, i.quantity::bigint as current_quantity
    from public.jintan_parts_inventory i
    union all
    select 2, 'profiles', i.id, i.item_type, i.profile_model, i.profile_name, i.specification,
      i.material, ''::text, i.quantity::bigint
    from public.jintan_profiles_inventory i
    union all
    select 3, 'materials', i.id, i.item_type, i.material_model, i.material_name, i.specification,
      i.material, ''::text, i.quantity::bigint
    from public.jintan_materials_inventory i
  )
  select
    it.category,
    it.inventory_id,
    it.item_type,
    it.item_model,
    it.item_name,
    it.specification,
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
  order by it.category_rank, it.item_model, it.item_name, it.specification, it.item_type;
end;
$$;
