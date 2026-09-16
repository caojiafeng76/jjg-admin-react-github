create or replace view public.order_status_dashboard_order_summaries with (security_invoker = true) as with material_transfer_summary as (
    select mt.project_no,
      coalesce(sum(mt.transfer_quantity), 0)::numeric as transfer_quantity,
      coalesce(
        sum(mt.transfer_quantity) filter (
          where nullif(btrim(mt.target_workshop), '') = '仓库'
        ),
        0
      )::numeric as warehouse_transfer_quantity,
      count(*)::integer as transfer_record_count,
      (
        array_agg(
          nullif(btrim(mt.target_workshop), '')
          order by mt.created_at desc
        )
      ) [1] as latest_transfer_workshop,
      (
        array_agg(
          mt.created_at
          order by mt.created_at desc
        )
      ) [1] as latest_transfer_at,
      (
        array_agg(
          (mt.operator_names) [1]
          order by mt.created_at desc
        )
      ) [1] as latest_transfer_operator_names
    from public.material_transfers as mt
    where nullif(btrim(mt.project_no), '') is not null
    group by mt.project_no
  ),
  precision_cutting_summary as (
    select pct.project_no,
      coalesce(sum(pct.transfer_quantity), 0)::numeric as precision_cutting_quantity
    from public.precision_cutting_transfers as pct
    where nullif(btrim(pct.project_no), '') is not null
    group by pct.project_no
  ),
  production_summary as (
    select poi.project_no,
      count(*)::integer as production_item_count,
      coalesce(sum(poi.incoming_qualified_quantity), 0)::numeric as total_incoming_quantity,
      coalesce(sum(poi.qualified_quantity), 0)::numeric as total_qualified_quantity,
      coalesce(
        sum(
          coalesce(poi.defect_quantity_1, 0) + coalesce(poi.defect_quantity_2, 0) + coalesce(poi.outsource_defect_quantity, 0) + coalesce(poi.setup_defect_quantity, 0)
        ),
        0
      )::numeric as total_defect_quantity
    from public.production_order_items as poi
    where poi.data_category <> 'B'
      and nullif(btrim(poi.project_no), '') is not null
    group by poi.project_no
  ),
  base as (
    select so.id,
      so.product_delivery_date,
      so.project_no,
      so.product_model,
      so.length_mm,
      so.customer_model,
      so.order_quantity,
      so.weight_per_meter_kg,
      so.color_name,
      so.package_name,
      so.product_category,
      so.material_name,
      so.material_code,
      so.created_at,
      so.updated_at,
      so.customer,
      so.status,
      so.process_flow,
      so.length_tolerance,
      so.row_remark,
      coalesce(mt.transfer_quantity, 0)::numeric as transfer_quantity,
      coalesce(mt.warehouse_transfer_quantity, 0)::numeric as warehouse_transfer_quantity,
      coalesce(mt.transfer_record_count, 0)::integer as transfer_record_count,
      mt.latest_transfer_workshop,
      mt.latest_transfer_at,
      mt.latest_transfer_operator_names,
      coalesce(pct.precision_cutting_quantity, 0)::numeric as precision_cutting_quantity,
      coalesce(ps.production_item_count, 0)::integer as production_item_count,
      coalesce(ps.total_incoming_quantity, 0)::numeric as total_incoming_quantity,
      coalesce(ps.total_qualified_quantity, 0)::numeric as total_qualified_quantity,
      coalesce(ps.total_defect_quantity, 0)::numeric as total_defect_quantity,
      case
        when coalesce(so.order_quantity, 0) > 0 then round(
          (
            coalesce(mt.transfer_quantity, 0)::numeric / so.order_quantity::numeric
          ) * 100,
          1
        )
        else null
      end as completion_rate,
      case
        when coalesce(ps.total_qualified_quantity, 0) + coalesce(ps.total_defect_quantity, 0) > 0 then round(
          (
            coalesce(ps.total_qualified_quantity, 0)::numeric / (
              coalesce(ps.total_qualified_quantity, 0) + coalesce(ps.total_defect_quantity, 0)
            )::numeric
          ) * 100,
          1
        )
        else null
      end as yield_rate
    from public.sales_orders as so
      left join material_transfer_summary as mt on mt.project_no = so.project_no
      left join precision_cutting_summary as pct on pct.project_no = so.project_no
      left join production_summary as ps on ps.project_no = so.project_no
  )
select base.*,
  case
    when nullif(btrim(coalesce(base.status, '')), '') = '已结案'
    or coalesce(base.completion_rate, 0) >= 100 then '正常'
    when base.product_delivery_date is not null
    and base.product_delivery_date < current_date then '延期'
    when base.product_delivery_date is not null
    and base.product_delivery_date - current_date <= 7
    and coalesce(base.completion_rate, 0) < 100 then '预警'
    when base.completion_rate is not null
    and base.completion_rate > 0
    and base.completion_rate < 50 then '预警'
    else '正常'
  end as production_status
from base;