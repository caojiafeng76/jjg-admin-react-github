-- ============================================================
-- 金檀木业库存调整流水
--   jintan_inventory_adjustments  配件/型材/素材库存被直接改数时由触发器写入
--   覆盖抽屉调整、库存页编辑、Excel 导入；出入库单引起的库存变化已有流水，不重复记录
--   月度报表计入调整，历史月份的结余不再随直接改数变化：
--     上月结余 = 当前库存 - 月初起（入库 - 出库 + 调整）合计
--     月末结存 = 上月结余 + 本月入库 - 本月出库 + 本月调整
-- ============================================================

-- 审计记录不设外键：资料删除后保留，也不阻止资料删除
create table public.jintan_inventory_adjustments (
  id              uuid primary key default gen_random_uuid(),
  category        text not null check (category in ('parts', 'profiles', 'materials')),
  inventory_id    uuid not null,
  item_model      text not null default '',
  item_name       text not null default '',
  specification   text not null default '',
  material        text not null default '',
  quantity_before integer not null,
  quantity_after  integer not null,
  difference      integer generated always as (quantity_after - quantity_before) stored,
  remarks         text not null default '',
  operator_name   text not null default '',
  created_at      timestamptz not null default now()
);

comment on table public.jintan_inventory_adjustments is '金檀木业库存调整流水（直接改数时由触发器写入）';
comment on column public.jintan_inventory_adjustments.category is '库存类别：parts / profiles / materials';
comment on column public.jintan_inventory_adjustments.inventory_id is '对应类别的库存行 ID';
comment on column public.jintan_inventory_adjustments.difference is '差额 = 调整后 - 调整前';
comment on column public.jintan_inventory_adjustments.operator_name is '操作人姓名快照，非员工账号或后台操作时为空';

create index idx_jintan_inventory_adjustments_inventory_created_at
  on public.jintan_inventory_adjustments (inventory_id, created_at desc);
create index idx_jintan_inventory_adjustments_created_at
  on public.jintan_inventory_adjustments (created_at);

alter table public.jintan_inventory_adjustments enable row level security;
revoke all on public.jintan_inventory_adjustments from anon, authenticated;
grant select on public.jintan_inventory_adjustments to authenticated;

create policy "Jintan inventory adjustments select"
on public.jintan_inventory_adjustments for select to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:jintan-' || category || '-inventory')
);

create function public.record_jintan_inventory_adjustment()
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
    category, inventory_id, item_model, item_name, specification, material,
    quantity_before, quantity_after, remarks, operator_name
  )
  values (
    tg_argv[0],
    new.id,
    coalesce(v_row ->> 'profile_model', v_row ->> 'material_model', ''),
    coalesce(v_row ->> 'part_name', v_row ->> 'profile_name', v_row ->> 'material_name', ''),
    coalesce(v_row ->> 'specification', ''),
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

revoke all on function public.record_jintan_inventory_adjustment() from public;

create trigger jintan_parts_inventory_record_adjustment
after update of quantity on public.jintan_parts_inventory
for each row
when (old.quantity is distinct from new.quantity)
execute function public.record_jintan_inventory_adjustment('parts');

create trigger jintan_profiles_inventory_record_adjustment
after update of quantity on public.jintan_profiles_inventory
for each row
when (old.quantity is distinct from new.quantity)
execute function public.record_jintan_inventory_adjustment('profiles');

create trigger jintan_materials_inventory_record_adjustment
after update of quantity on public.jintan_materials_inventory
for each row
when (old.quantity is distinct from new.quantity)
execute function public.record_jintan_inventory_adjustment('materials');

-- 返回列变化，需先删除再重建
drop function if exists public.get_jintan_monthly_inventory_report(date);

create function public.get_jintan_monthly_inventory_report(p_month date)
returns table (
  category text,
  inventory_id uuid,
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
      ''::text as item_model, i.part_name as item_name, i.specification, i.material,
      i.supplier, i.quantity::bigint as current_quantity
    from public.jintan_parts_inventory i
    union all
    select 2, 'profiles', i.id, i.profile_model, i.profile_name, i.specification,
      i.material, ''::text, i.quantity::bigint
    from public.jintan_profiles_inventory i
    union all
    select 3, 'materials', i.id, i.material_model, i.material_name, i.specification,
      i.material, ''::text, i.quantity::bigint
    from public.jintan_materials_inventory i
  )
  select
    it.category,
    it.inventory_id,
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
  order by it.category_rank, it.item_model, it.item_name, it.specification;
end;
$$;

comment on function public.get_jintan_monthly_inventory_report(date) is
  '金檀木业月度库存报表：按 Asia/Shanghai 月份返回配件/型材/素材的上月结余、本月入库、本月出库、本月调整、月末结存';

revoke all on function public.get_jintan_monthly_inventory_report(date) from public, anon;
grant execute on function public.get_jintan_monthly_inventory_report(date) to authenticated;
