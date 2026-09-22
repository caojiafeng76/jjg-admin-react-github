-- Register the module-specific override; keep existing roles and RLS unchanged.
insert into public.permissions (key, scope, module, surface, label, description)
values ('feature:precision-cutting-transfer.manage', 'feature', 'precision-cutting',
        'pc', '精切转移单-全部操作',
        '允许查看员执行精切转移单新增、编辑、删除、审核、反审核和导出')
on conflict (key) do nothing;
create or replace function public.prevent_viewer_dml()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.current_user_is_viewer() then
    -- Only this table and explicit per-user/role permission bypass viewer protection.
    if tg_table_schema = 'public'
      and tg_table_name = 'precision_cutting_transfers'
      and public.current_user_has_permission('feature:precision-cutting-transfer.manage')
    then
      if tg_op = 'DELETE' then
        return old;
      end if;
      return new;
    end if;

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
      and (
        public.current_user_has_permission('feature:workshop-order.create')
        or public.current_user_has_permission('feature:workshop-order.edit')
        or public.current_user_has_permission('feature:workshop-order.delete')
        or public.current_user_has_permission('feature:workshop-order.manage-status')
      )
    then
      if tg_op = 'DELETE' then
        return old;
      end if;

      return new;
    end if;

    if tg_table_schema = 'public'
      and tg_table_name in (
        'packaging_employees',
        'packaging_standard_times'
      )
      and (
        public.current_user_has_permission('feature:packaging-process-employee-list.create')
        or public.current_user_has_permission('feature:packaging-process-employee-list.edit')
        or public.current_user_has_permission('feature:packaging-process-employee-list.delete')
        or public.current_user_has_permission('feature:packaging-process-standard-time-list.create')
        or public.current_user_has_permission('feature:packaging-process-standard-time-list.edit')
        or public.current_user_has_permission('feature:packaging-process-standard-time-list.delete')
      )
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
$function$;;

with target as (
  select e.id
  from public.employees e
  join auth.users u on u.id = e.auth_user_id
  where lower(u.email) = 'wuwenwen@ydly.cn'
    and e.name = '吴雯雯'
    and e.is_active = true
), granted as (
  insert into public.user_permission_overrides (employee_id, permission_id, enabled)
  select t.id, p.id, true
  from target t
  cross join public.permissions p
  where (select count(*) from target) = 1
    and p.key in (
      'nav:precision-cutting',
      'page:precision-cutting-transfer',
      'feature:precision-cutting-transfer.manage'
    )
  on conflict (employee_id, permission_id) do update set enabled = true
  returning employee_id, permission_id, enabled
)
select e.name, e.role, p.key, g.enabled
from granted g
join public.employees e on e.id = g.employee_id
join public.permissions p on p.id = g.permission_id;


