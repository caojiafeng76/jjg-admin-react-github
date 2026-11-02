-- ============================================================
-- 金檀木业月度库存报表
--   get_jintan_monthly_inventory_report(p_month)  按月汇总配件/型材/素材的结余与出入库
--   口径（月份区间按 Asia/Shanghai 的 [月初, 下月初)）：
--     本月入库 / 本月出库 = 区间内出入库记录数量合计
--     上月结余 = 当前库存 - 月初起入库合计 + 月初起出库合计
--     月末结存 = 上月结余 + 本月入库 - 本月出库
--   库存页直接改数、Excel 导入库存不产生流水，不计入倒推
-- ============================================================

insert into public.permissions (key, scope, module, surface, label)
values
  ('page:jintan-monthly-report', 'page', 'jintan', 'pc', '金檀月度报表')
on conflict (key) do nothing;

create or replace function public.get_jintan_monthly_inventory_report(p_month date)
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
    select 'parts'::text as category, s.inventory_id, s.quantity, 1 as direction, s.created_at
    from public.jintan_parts_stock_in s
    where s.created_at >= v_start
    union all
    select 'parts', s.inventory_id, s.quantity, -1, s.created_at
    from public.jintan_parts_stock_out s
    where s.created_at >= v_start
    union all
    select 'profiles', s.inventory_id, s.quantity, 1, s.created_at
    from public.jintan_profiles_stock_in s
    where s.created_at >= v_start
    union all
    select 'profiles', s.inventory_id, s.quantity, -1, s.created_at
    from public.jintan_profiles_stock_out s
    where s.created_at >= v_start
    union all
    select 'materials', s.inventory_id, s.quantity, 1, s.created_at
    from public.jintan_materials_stock_in s
    where s.created_at >= v_start
    union all
    select 'materials', s.inventory_id, s.quantity, -1, s.created_at
    from public.jintan_materials_stock_out s
    where s.created_at >= v_start
  ),
  movement_totals as (
    select
      m.category,
      m.inventory_id,
      coalesce(sum(m.quantity * m.direction), 0)::bigint as net_since_start,
      coalesce(sum(m.quantity) filter (where m.direction = 1 and m.created_at < v_end), 0)::bigint as month_in,
      coalesce(sum(m.quantity) filter (where m.direction = -1 and m.created_at < v_end), 0)::bigint as month_out
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
    it.current_quantity - coalesce(t.net_since_start, 0)
      + coalesce(t.month_in, 0) - coalesce(t.month_out, 0) as closing_quantity,
    it.current_quantity
  from items it
  left join movement_totals t
    on t.category = it.category and t.inventory_id = it.inventory_id
  order by it.category_rank, it.item_model, it.item_name, it.specification;
end;
$$;

comment on function public.get_jintan_monthly_inventory_report(date) is
  '金檀木业月度库存报表：按 Asia/Shanghai 月份返回配件/型材/素材的上月结余、本月入库、本月出库、月末结存';

revoke all on function public.get_jintan_monthly_inventory_report(date) from public, anon;
grant execute on function public.get_jintan_monthly_inventory_report(date) to authenticated;
