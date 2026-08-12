-- 排产页聚合视图：把 JS 端逐行拉取求和下推到 SQL
-- 目标：翻页/改筛选时，每个 project_no 只返回 1 行聚合结果，
-- 而不是把 production_order_items / material_transfers 的明细行全部拉回前端。

-- 1. 已加工数量：按项目号汇总 qualified_quantity
create or replace view public.v_production_quantity_by_project as
select
  project_no,
  sum(qualified_quantity) as total_qualified_quantity
from public.production_order_items
where project_no is not null and project_no <> ''
group by project_no;

-- 2. 物料转移汇总：按项目号统计条数/总量/最近一次转移
--    latest_workshop 通过子查询取每个项目号 created_at 最新的那条
create or replace view public.v_material_transfer_summary_by_project as
select
  m.project_no,
  count(*) as record_count,
  sum(m.transfer_quantity) as total_transfer_quantity,
  max(m.created_at) as latest_created_at,
  (
    select m2.target_workshop
    from public.material_transfers m2
    where m2.project_no = m.project_no
    order by m2.created_at desc
    limit 1
  ) as latest_workshop
from public.material_transfers m
where m.project_no is not null and m.project_no <> ''
group by m.project_no;
