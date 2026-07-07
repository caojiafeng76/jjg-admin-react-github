-- ============================================================
-- 修复吴雯雯订单管理增改删权限与包装工序数据可见性
--
-- 根因：
-- - 订单管理此前只有 delete / manage-status 两个 feature 权限点，
--   缺少 create / edit，权限管理无法精确授予新增和编辑。
-- - packaging_employees / packaging_standard_times 只有 admin RLS，
--   viewer 即使拥有对应 page 权限也查不到数据。
-- ============================================================

insert into public.permissions (key, scope, module, surface, label, description)
values
  (
    'feature:workshop-order.create',
    'feature',
    'workshop-order-list',
    'pc',
    '订单管理-新建',
    '控制订单列表中"添加"按钮与新建订单入口'
  ),
  (
    'feature:workshop-order.edit',
    'feature',
    'workshop-order-list',
    'pc',
    '订单管理-编辑',
    '控制订单列表中"编辑"按钮与编辑订单入口'
  )
on conflict (key) do update
set
  scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label,
  description = excluded.description;

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
    'feature:workshop-order.create',
    'feature:workshop-order.edit',
    'feature:workshop-order.delete'
  )
on conflict (employee_id, permission_id) do update
set enabled = excluded.enabled;

drop policy if exists "packaging_employees permission rw" on public.packaging_employees;
create policy "packaging_employees permission rw"
on public.packaging_employees
for all to authenticated
using (public.current_user_has_permission('page:packaging-process-employee-list'))
with check (public.current_user_has_permission('page:packaging-process-employee-list'));

drop policy if exists "packaging_standard_times permission rw" on public.packaging_standard_times;
create policy "packaging_standard_times permission rw"
on public.packaging_standard_times
for all to authenticated
using (public.current_user_has_permission('page:packaging-process-standard-time-list'))
with check (public.current_user_has_permission('page:packaging-process-standard-time-list'));

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
$function$;
