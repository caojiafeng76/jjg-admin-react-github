create or replace function public.get_order_status_dashboard_v2(
    p_page integer default 1,
    p_page_size integer default 20,
    p_status text default null,
    p_production_status text default null,
    p_project_no text default null,
    p_material_code text default null,
    p_model_keywords text [] default null,
    p_order_date text default null,
    p_customer text default null
  ) returns jsonb language sql stable
set search_path = public as $$ with normalized_params as (
    select greatest(coalesce(p_page, 1), 1) as page,
      least(greatest(coalesce(p_page_size, 20), 1), 200) as page_size,
      nullif(btrim(p_status), '') as status,
      nullif(btrim(p_production_status), '') as production_status,
      nullif(btrim(p_project_no), '') as project_no,
      nullif(btrim(p_material_code), '') as material_code,
      nullif(btrim(p_order_date), '') as order_date,
      nullif(btrim(p_customer), '') as customer,
      coalesce(
        array(
          select nullif(btrim(keyword), '')
          from unnest(coalesce(p_model_keywords, array []::text [])) as keyword
          where nullif(btrim(keyword), '') is not null
        ),
        array []::text []
      ) as model_keywords
  ),
  filtered_orders as (
    select summary.*
    from public.order_status_dashboard_order_summaries as summary
      cross join normalized_params as params
    where (
        params.status is null
        or summary.status = params.status
      )
      and (
        params.production_status is null
        or summary.production_status = params.production_status
      )
      and (
        params.project_no is null
        or summary.project_no ilike '%' || params.project_no || '%'
      )
      and (
        params.customer is null
        or summary.customer ilike '%' || params.customer || '%'
      )
      and (
        params.material_code is null
        or summary.material_code ilike '%' || params.material_code || '%'
      )
      and (
        params.order_date is null
        or summary.product_delivery_date::text ilike '%' || params.order_date || '%'
      )
      and (
        cardinality(params.model_keywords) = 0
        or exists (
          select 1
          from unnest(params.model_keywords) as keyword
          where summary.product_model ilike '%' || keyword || '%'
            or summary.customer_model ilike '%' || keyword || '%'
        )
      )
  ),
  total_count as (
    select count(*)::integer as value
    from filtered_orders
  ),
  paged_orders as (
    select filtered_orders.*
    from filtered_orders
      cross join normalized_params as params
    order by filtered_orders.created_at desc,
      filtered_orders.project_no asc
    limit (
        select page_size
        from normalized_params
      ) offset (
        (
          select page
          from normalized_params
        ) - 1
      ) * (
        select page_size
        from normalized_params
      )
  ),
  production_details as (
    select poi.project_no,
      count(*)::integer as detail_count,
      jsonb_agg(
        jsonb_build_object(
          'id',
          poi.id,
          'created_at',
          poi.created_at,
          'updated_at',
          poi.updated_at,
          'data_category',
          poi.data_category,
          'project_no',
          poi.project_no,
          'product_model',
          poi.product_model,
          'customer_model',
          poi.customer_model,
          'length_mm',
          poi.length_mm,
          'operation',
          poi.operation,
          'incoming_qualified_quantity',
          poi.incoming_qualified_quantity,
          'qualified_quantity',
          poi.qualified_quantity,
          'qualified_hours',
          poi.qualified_hours,
          'defect_quantity_1',
          poi.defect_quantity_1,
          'defect_quantity_2',
          poi.defect_quantity_2,
          'defect_reason_1',
          poi.defect_reason_1,
          'defect_reason_2',
          poi.defect_reason_2,
          'defect_hours',
          poi.defect_hours,
          'outsource_defect_quantity',
          poi.outsource_defect_quantity,
          'outsource_defect_reason',
          poi.outsource_defect_reason,
          'outsource_unit',
          poi.outsource_unit,
          'setup_defect_quantity',
          poi.setup_defect_quantity,
          'setup_responsible',
          poi.setup_responsible,
          'standard_seconds',
          poi.standard_seconds,
          'theoretical_seconds',
          poi.theoretical_seconds,
          'remark',
          poi.remark,
          'order_id',
          poi.order_id,
          'machine_equipment_id',
          poi.machine_equipment_id,
          'production_orders',
          case
            when po.id is null then null
            else jsonb_build_object(
              'id',
              po.id,
              'order_date',
              po.order_date,
              'shift',
              po.shift,
              'work_hours',
              po.work_hours,
              'employee',
              case
                when employee.id is null then null
                else jsonb_build_object('name', employee.name)
              end
            )
          end,
          'machine_equipment_maintenances',
          case
            when machine.id is null then null
            else jsonb_build_object(
              'unified_device_no',
              machine.unified_device_no,
              'machine_name',
              machine.machine_name
            )
          end
        )
        order by coalesce(po.order_date::text, poi.created_at::text) desc,
          poi.created_at desc
      ) as rows
    from public.production_order_items as poi
      join paged_orders as orders on orders.project_no = poi.project_no
      left join public.production_orders as po on po.id = poi.order_id
      left join public.employees as employee on employee.id = po.employee_id
      left join public.machine_equipment_maintenances as machine on machine.id = poi.machine_equipment_id
    where poi.data_category <> 'B'
    group by poi.project_no
  ),
  material_transfer_details as (
    select mt.project_no,
      count(*)::integer as detail_count,
      jsonb_agg(
        jsonb_build_object(
          'createdAt',
          mt.created_at,
          'isAudited',
          mt.is_audited,
          'operatorNames',
          coalesce(to_jsonb(mt.operator_names), '[]'::jsonb),
          'recipientName',
          mt.recipient_name,
          'targetWorkshop',
          mt.target_workshop,
          'transferQuantity',
          coalesce(mt.transfer_quantity, 0)
        )
        order by mt.created_at desc
      ) as rows
    from public.material_transfers as mt
      join paged_orders as orders on orders.project_no = mt.project_no
    group by mt.project_no
  ),
  precision_cutting_details as (
    select pct.project_no,
      jsonb_agg(
        jsonb_build_object(
          'createdAt',
          pct.created_at,
          'defectReason',
          pct.defect_reason,
          'id',
          pct.id,
          'isAudited',
          pct.is_audited,
          'lengthMm',
          pct.length_mm,
          'longMaterialLengthMm',
          coalesce(pct.long_material_length_mm, 0),
          'longMaterialQuantity',
          coalesce(pct.long_material_quantity, 0),
          'operatorNames',
          coalesce(to_jsonb(pct.operator_names), '[]'::jsonb),
          'outsourceDefectQuantity',
          coalesce(pct.outsource_defect_quantity, 0),
          'outsourceDefectReason',
          pct.outsource_defect_reason,
          'outsourceUnit',
          pct.outsource_unit,
          'processOwner',
          pct.process_owner,
          'processingDefectCount',
          coalesce(pct.processing_defect_count, 0),
          'rawMaterialDefectCount',
          coalesce(pct.raw_material_defect_count, 0),
          'recipientName',
          pct.recipient_name,
          'remark',
          pct.remark,
          'responsibleProcess',
          pct.responsible_process,
          'targetWorkshop',
          pct.target_workshop,
          'transferQuantity',
          coalesce(pct.transfer_quantity, 0)
        )
        order by pct.created_at desc
      ) as rows
    from public.precision_cutting_transfers as pct
      join paged_orders as orders on orders.project_no = pct.project_no
    group by pct.project_no
  ),
  rework_repair_details as (
    select qrr.project_no,
      jsonb_agg(
        jsonb_build_object(
          'workflow_status',
          qrr.workflow_status,
          'quantity',
          coalesce(qrr.quantity, 0)
        )
        order by qrr.created_at desc
      ) as rows
    from public.quality_rework_repairs as qrr
      join paged_orders as orders on orders.project_no = qrr.project_no
    group by qrr.project_no
  ),
  items as (
    select orders.created_at,
      orders.project_no,
      jsonb_build_object(
        'id',
        orders.id,
        'product_delivery_date',
        orders.product_delivery_date,
        'project_no',
        orders.project_no,
        'product_model',
        orders.product_model,
        'length_mm',
        orders.length_mm,
        'customer_model',
        orders.customer_model,
        'order_quantity',
        orders.order_quantity,
        'weight_per_meter_kg',
        orders.weight_per_meter_kg,
        'color_name',
        orders.color_name,
        'package_name',
        orders.package_name,
        'product_category',
        orders.product_category,
        'material_name',
        orders.material_name,
        'material_code',
        orders.material_code,
        'created_at',
        orders.created_at,
        'updated_at',
        orders.updated_at,
        'customer',
        orders.customer,
        'status',
        orders.status,
        'process_flow',
        orders.process_flow,
        'length_tolerance',
        orders.length_tolerance,
        'row_remark',
        orders.row_remark,
        'totalIncomingQuantity',
        orders.total_incoming_quantity,
        'totalQualifiedQuantity',
        orders.total_qualified_quantity,
        'totalDefectQuantity',
        orders.total_defect_quantity,
        'precisionCuttingQuantity',
        orders.precision_cutting_quantity,
        'precisionCuttingDetails',
        coalesce(pct_details.rows, '[]'::jsonb),
        'transferQuantity',
        orders.transfer_quantity,
        'warehouseTransferQuantity',
        orders.warehouse_transfer_quantity,
        'transferRecordCount',
        orders.transfer_record_count,
        'transferWorkshops',
        coalesce(
          (
            select jsonb_agg(
                workshop
                order by workshop
              )
            from (
                select distinct nullif(btrim(mt.target_workshop), '') as workshop
                from public.material_transfers as mt
                where mt.project_no = orders.project_no
                  and nullif(btrim(mt.target_workshop), '') is not null
              ) as workshops
          ),
          '[]'::jsonb
        ),
        'latestTransferWorkshop',
        orders.latest_transfer_workshop,
        'latestTransferAt',
        orders.latest_transfer_at,
        'latestTransferOperatorNames',
        coalesce(
          (
            select to_jsonb(mt_latest.operator_names)
            from public.material_transfers as mt_latest
            where mt_latest.project_no = orders.project_no
            order by mt_latest.created_at desc
            limit 1
          ), '[]'::jsonb
        ), 'transferDetails', coalesce(mt_details.rows, '[]'::jsonb), 'finishedQuantity', orders.transfer_quantity, 'completionRate', orders.completion_rate, 'yieldRate', orders.yield_rate, 'productionStatus', orders.production_status, 'productionRows', coalesce(prod_details.rows, '[]'::jsonb), 'reworkRepairRows', coalesce(rwr_details.rows, '[]'::jsonb)
      ) as value
    from paged_orders as orders
      left join production_details as prod_details on prod_details.project_no = orders.project_no
      left join material_transfer_details as mt_details on mt_details.project_no = orders.project_no
      left join precision_cutting_details as pct_details on pct_details.project_no = orders.project_no
      left join rework_repair_details as rwr_details on rwr_details.project_no = orders.project_no
  )
select jsonb_build_object(
    'items',
    coalesce(
      (
        select jsonb_agg(
            items.value
            order by items.created_at desc,
              items.project_no asc
          )
        from items
      ),
      '[]'::jsonb
    ),
    'total',
    (
      select value
      from total_count
    ),
    'productionItemCount',
    coalesce(
      (
        select sum(production_item_count)::integer
        from paged_orders
      ),
      0
    ),
    'materialTransferCount',
    coalesce(
      (
        select sum(transfer_record_count)::integer
        from paged_orders
      ),
      0
    )
  );
$$;
