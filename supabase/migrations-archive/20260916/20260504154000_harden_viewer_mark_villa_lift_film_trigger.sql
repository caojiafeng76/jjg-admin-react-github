-- 加固通用 viewer DML 触发器：先按目标表分支，再访问 villa_lift_orders 字段
create or replace function public.prevent_viewer_dml() returns trigger language plpgsql security definer
set search_path to 'public' as $function$ begin if public.current_user_is_viewer() then if tg_table_schema = 'public'
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