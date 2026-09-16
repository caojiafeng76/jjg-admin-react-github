-- 修复通知触发器：改为 SECURITY DEFINER，使触发器以函数所有者身份运行
-- 问题原因：SECURITY INVOKER 下员工/班组长上下文中 employees 表 RLS 可能导致
--         actor_display_name 为 null，触发器静默退出而不写入通知
-- 修复后：触发器绕过 RLS，始终能读取 employees 姓名并写入 notifications
create or replace function public.create_notification_for_production_order() returns trigger language plpgsql security definer
set search_path = public as $$
declare actor_id uuid;
actor_display_name text;
begin actor_id := public.current_employee_id();
if actor_id is null then return new;
end if;
select e.name into actor_display_name
from public.employees e
where e.id = actor_id;
if actor_display_name is null
or btrim(actor_display_name) = '' then return new;
end if;
if tg_op = 'UPDATE'
and new.order_date is not distinct
from old.order_date
  and new.employee_id is not distinct
from old.employee_id
  and new.work_hours is not distinct
from old.work_hours
  and new.extra_qualified_hours is not distinct
from old.extra_qualified_hours
  and new.remark is not distinct
from old.remark
  and new.is_audited is not distinct
from old.is_audited
  and new.audited_at is not distinct
from old.audited_at
  and new.shift is not distinct
from old.shift then return new;
end if;
insert into public.notifications (
    actor_employee_id,
    actor_name,
    entity_type,
    entity_id,
    action_type
  )
values (
    actor_id,
    actor_display_name,
    'production_order',
    new.id,
    case
      when tg_op = 'INSERT' then 'create'
      else 'update'
    end
  );
return new;
end;
$$;
create or replace function public.create_notification_for_material_transfer() returns trigger language plpgsql security definer
set search_path = public as $$
declare actor_id uuid;
actor_display_name text;
begin actor_id := public.current_employee_id();
if actor_id is null then return new;
end if;
select e.name into actor_display_name
from public.employees e
where e.id = actor_id;
if actor_display_name is null
or btrim(actor_display_name) = '' then return new;
end if;
if tg_op = 'UPDATE'
and new.project_no is not distinct
from old.project_no
  and new.customer is not distinct
from old.customer
  and new.product_model is not distinct
from old.product_model
  and new.length_mm is not distinct
from old.length_mm
  and new.customer_model is not distinct
from old.customer_model
  and new.transfer_quantity is not distinct
from old.transfer_quantity
  and new.operator_employee_id is not distinct
from old.operator_employee_id
  and new.operator_employee_ids is not distinct
from old.operator_employee_ids
  and new.operator_names is not distinct
from old.operator_names
  and new.target_workshop is not distinct
from old.target_workshop
  and new.recipient_name is not distinct
from old.recipient_name
  and new.shift_leader_name is not distinct
from old.shift_leader_name
  and new.inspector_name is not distinct
from old.inspector_name
  and new.uploaded_by_name is not distinct
from old.uploaded_by_name
  and new.remark is not distinct
from old.remark
  and new.is_audited is not distinct
from old.is_audited
  and new.audited_at is not distinct
from old.audited_at then return new;
end if;
insert into public.notifications (
    actor_employee_id,
    actor_name,
    entity_type,
    entity_id,
    action_type
  )
values (
    actor_id,
    actor_display_name,
    'material_transfer',
    new.id,
    case
      when tg_op = 'INSERT' then 'create'
      else 'update'
    end
  );
return new;
end;
$$;