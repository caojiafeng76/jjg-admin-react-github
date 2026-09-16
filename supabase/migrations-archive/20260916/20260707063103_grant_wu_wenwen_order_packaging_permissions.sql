-- ============================================================
-- 吴雯雯加开订单管理和包装工序全部权限
--
-- 背景：
-- - 吴雯雯当前为 viewer，常规 viewer 只读。
-- - 本次只通过用户级权限覆盖授予订单管理和包装工序权限，
--   不扩大 viewer 角色的默认权限面。
-- - 订单管理底层 sales_orders 已挂 viewer DML 防护触发器，
--   因此同步允许同时拥有订单管理删除和状态变更权限的 viewer
--   对 sales_orders 执行对应页面操作。
-- ============================================================

insert into public.user_permission_overrides (employee_id, permission_id, enabled)
select e.id,
  p.id,
  true
from public.employees e
cross join public.permissions p
where e.id = '91e20061-7058-4ddb-8aaf-ea33ea141857'::uuid
  and e.name = '吴雯雯'
  and e.auth_user_id = '230a0803-6136-41ac-9674-1bfb1dac89ab'::uuid
  and e.role = 'viewer'
  and e.is_active = true
  and p.key in (
    'nav:workshop-order-list',
    'page:workshop-order-production',
    'page:workshop-order-closed',
    'page:workshop-order-qr-detail',
    'feature:workshop-order.delete',
    'feature:workshop-order.manage-status',
    'nav:packaging-process',
    'page:packaging-process-employee-list',
    'page:packaging-process-standard-time-list',
    'page:packaging-process-work-order-list',
    'feature:packaging-process-employee-list.create',
    'feature:packaging-process-employee-list.edit',
    'feature:packaging-process-employee-list.delete',
    'feature:packaging-process-standard-time-list.create',
    'feature:packaging-process-standard-time-list.edit',
    'feature:packaging-process-standard-time-list.delete',
    'feature:packaging-process-work-order-list.create',
    'feature:packaging-process-work-order-list.edit',
    'feature:packaging-process-work-order-list.delete',
    'feature:packaging-process-work-order-list.export'
  )
on conflict (employee_id, permission_id) do update
set enabled = excluded.enabled;

create or replace function public.prevent_viewer_dml()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.current_user_is_viewer() then
    if tg_table_schema = 'public'
      and tg_table_name in (
        'tooling_data',
        'tooling_inventory',
        'tooling_stock_in',
        'tooling_stock_out'
      )
      and public.current_user_has_permission('feature:tooling.manage')
    then
      if tg_op = 'DELETE' then
        return old;
      end if;

      return new;
    end if;

    if tg_table_schema = 'public'
      and tg_table_name in (
        'youmai_product_data',
        'youmai_finished_goods_inventory',
        'youmai_finished_goods_stock_in',
        'youmai_finished_goods_stock_out',
        'youmai_raw_material_inventory',
        'youmai_raw_material_stock_in',
        'youmai_raw_material_stock_out'
      )
      and public.current_user_has_permission('feature:youmai.manage')
    then
      if tg_op = 'DELETE' then
        return old;
      end if;

      return new;
    end if;

    if tg_table_schema = 'public'
      and tg_table_name = 'sales_orders'
      and public.current_user_has_permission('feature:workshop-order.delete')
      and public.current_user_has_permission('feature:workshop-order.manage-status')
    then
      if tg_op = 'DELETE' then
        return old;
      end if;

      return new;
    end if;

    if tg_table_schema = 'public'
      and tg_table_name = 'villa_lift_orders'
      and tg_op = 'UPDATE'
    then
      if public.current_user_has_permission('feature:villa-lift-order.mark-film')
        and new.film_date is not null
        and new.id is not distinct from old.id
        and new.schedule_date is not distinct from old.schedule_date
        and new.delivery_date is not distinct from old.delivery_date
        and new.customer is not distinct from old.customer
        and new.project_name is not distinct from old.project_name
        and new.product_name is not distinct from old.product_name
        and new.color is not distinct from old.color
        and new.quantity is not distinct from old.quantity
        and new.remarks is not distinct from old.remarks
        and new.created_at is not distinct from old.created_at
        and new.status is not distinct from old.status
        and new.material_selection_date is not distinct from old.material_selection_date
        and new.painting_date is not distinct from old.painting_date
        and new.cutting_required_date is not distinct from old.cutting_required_date
        and new.cutting_actual_date is not distinct from old.cutting_actual_date
        and new.processing_required_date is not distinct from old.processing_required_date
        and new.processing_actual_date is not distinct from old.processing_actual_date
        and new.inspection_date is not distinct from old.inspection_date
        and new.tinting_plan_date is not distinct from old.tinting_plan_date
        and new.painting_plan_date is not distinct from old.painting_plan_date
        and new.film_plan_date is not distinct from old.film_plan_date
        and new.assembly_date is not distinct from old.assembly_date
        and new.packaging_date is not distinct from old.packaging_date
        and new.planned_delivery_date is not distinct from old.planned_delivery_date
        and new.cabin_processing_date is not distinct from old.cabin_processing_date
        and new.middle_door_processing_date is not distinct from old.middle_door_processing_date
        and new.frame_processing_date is not distinct from old.frame_processing_date
      then
        return new;
      end if;
    end if;

    raise exception '查看员仅可查看数据，不能执行新增、编辑、删除、导入、导出或权限调整操作'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;
