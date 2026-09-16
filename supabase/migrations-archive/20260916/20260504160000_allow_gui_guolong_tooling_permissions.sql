insert into public.permissions (key, scope, module, surface, label, description)
values (
    'nav:consumables',
    'nav',
    'consumables',
    'pc',
    '刀具菜单分组',
    null
  ),
  (
    'page:tooling-data',
    'page',
    'consumables',
    'pc',
    '刀具资料',
    null
  ),
  (
    'page:tooling-inventory',
    'page',
    'consumables',
    'pc',
    '刀具库存',
    null
  ),
  (
    'page:tooling-stock-in',
    'page',
    'consumables',
    'pc',
    '刀具入库',
    null
  ),
  (
    'page:tooling-stock-out',
    'page',
    'consumables',
    'pc',
    '刀具出库',
    null
  ),
  (
    'feature:tooling.manage',
    'feature',
    'consumables',
    'pc',
    '刀具模块-全部操作',
    '允许查看员绕过只读限制，执行刀具资料、库存、入库和出库操作'
  ) on conflict (key) do
update
set scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label,
  description = excluded.description;
insert into public.role_permissions (role, permission_id)
select 'admin',
  p.id
from public.permissions p
where p.module = 'consumables' on conflict (role, permission_id) do nothing;
insert into public.user_permission_overrides (employee_id, permission_id, enabled)
select e.id,
  p.id,
  true
from public.employees e
  cross join public.permissions p
where e.name = '归国龙'
  and e.auth_user_id = 'b59e96c4-e8ef-4333-870a-c810bf939501'::uuid
  and e.role = 'viewer'
  and e.is_active = true
  and p.module = 'consumables' on conflict (employee_id, permission_id) do
update
set enabled = excluded.enabled;
alter table if exists public.tooling_inventory enable row level security;
alter table if exists public.tooling_stock_in enable row level security;
alter table if exists public.tooling_stock_out enable row level security;
do $$ begin if to_regclass('public.tooling_inventory') is not null
and not exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'tooling_inventory'
    and policyname = 'tooling_inventory permission rw'
) then execute 'create policy "tooling_inventory permission rw" on public.tooling_inventory for all to authenticated using (public.current_user_has_permission(''page:tooling-inventory'')) with check (public.current_user_has_permission(''page:tooling-inventory''))';
end if;
if to_regclass('public.tooling_stock_in') is not null
and not exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'tooling_stock_in'
    and policyname = 'tooling_stock_in permission rw'
) then execute 'create policy "tooling_stock_in permission rw" on public.tooling_stock_in for all to authenticated using (public.current_user_has_permission(''page:tooling-stock-in'')) with check (public.current_user_has_permission(''page:tooling-stock-in''))';
end if;
if to_regclass('public.tooling_stock_out') is not null
and not exists (
  select 1
  from pg_policies
  where schemaname = 'public'
    and tablename = 'tooling_stock_out'
    and policyname = 'tooling_stock_out permission rw'
) then execute 'create policy "tooling_stock_out permission rw" on public.tooling_stock_out for all to authenticated using (public.current_user_has_permission(''page:tooling-stock-out'')) with check (public.current_user_has_permission(''page:tooling-stock-out''))';
end if;
end $$;
create or replace function public.prevent_viewer_dml() returns trigger language plpgsql security definer
set search_path to 'public' as $function$ begin if public.current_user_is_viewer() then if tg_table_schema = 'public'
  and tg_table_name in (
    'tooling_data',
    'tooling_inventory',
    'tooling_stock_in',
    'tooling_stock_out'
  )
  and public.current_user_has_permission('feature:tooling.manage') then if tg_op = 'DELETE' then return old;
end if;
return new;
end if;
if tg_table_schema = 'public'
and tg_table_name = 'villa_lift_orders'
and tg_op = 'UPDATE' then if public.current_user_has_permission('feature:villa-lift-order.mark-film')
and new.film_date is not null
and new.id is not distinct
from old.id
  and new.schedule_date is not distinct
from old.schedule_date
  and new.delivery_date is not distinct
from old.delivery_date
  and new.customer is not distinct
from old.customer
  and new.project_name is not distinct
from old.project_name
  and new.product_name is not distinct
from old.product_name
  and new.color is not distinct
from old.color
  and new.quantity is not distinct
from old.quantity
  and new.remarks is not distinct
from old.remarks
  and new.created_at is not distinct
from old.created_at
  and new.status is not distinct
from old.status
  and new.material_selection_date is not distinct
from old.material_selection_date
  and new.painting_date is not distinct
from old.painting_date
  and new.cutting_required_date is not distinct
from old.cutting_required_date
  and new.cutting_actual_date is not distinct
from old.cutting_actual_date
  and new.processing_required_date is not distinct
from old.processing_required_date
  and new.processing_actual_date is not distinct
from old.processing_actual_date
  and new.inspection_date is not distinct
from old.inspection_date
  and new.tinting_plan_date is not distinct
from old.tinting_plan_date
  and new.painting_plan_date is not distinct
from old.painting_plan_date
  and new.film_plan_date is not distinct
from old.film_plan_date
  and new.assembly_date is not distinct
from old.assembly_date
  and new.packaging_date is not distinct
from old.packaging_date
  and new.planned_delivery_date is not distinct
from old.planned_delivery_date
  and new.cabin_processing_date is not distinct
from old.cabin_processing_date
  and new.middle_door_processing_date is not distinct
from old.middle_door_processing_date
  and new.frame_processing_date is not distinct
from old.frame_processing_date then return new;
end if;
end if;
raise exception '查看员仅可查看数据，不能执行新增、编辑、删除、导入、导出或权限调整操作' using errcode = '42501';
end if;
if tg_op = 'DELETE' then return old;
end if;
return new;
end;
$function$;
do $$
declare v_table oid;
begin v_table := to_regclass('public.tooling_inventory');
if v_table is not null
and not exists (
  select 1
  from pg_trigger
  where tgname = 'prevent_viewer_dml_trigger'
    and tgrelid = v_table
    and not tgisinternal
) then execute 'create trigger prevent_viewer_dml_trigger before insert or update or delete on public.tooling_inventory for each row execute function public.prevent_viewer_dml()';
end if;
v_table := to_regclass('public.tooling_stock_in');
if v_table is not null
and not exists (
  select 1
  from pg_trigger
  where tgname = 'prevent_viewer_dml_trigger'
    and tgrelid = v_table
    and not tgisinternal
) then execute 'create trigger prevent_viewer_dml_trigger before insert or update or delete on public.tooling_stock_in for each row execute function public.prevent_viewer_dml()';
end if;
v_table := to_regclass('public.tooling_stock_out');
if v_table is not null
and not exists (
  select 1
  from pg_trigger
  where tgname = 'prevent_viewer_dml_trigger'
    and tgrelid = v_table
    and not tgisinternal
) then execute 'create trigger prevent_viewer_dml_trigger before insert or update or delete on public.tooling_stock_out for each row execute function public.prevent_viewer_dml()';
end if;
end $$;