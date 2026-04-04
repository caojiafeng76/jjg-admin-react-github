-- 修复通知触发器 skip 逻辑：用 pg_trigger_depth() > 1 替代字段比较
-- 问题：员工提交工单时只改了 items，production_orders 头部字段完全没变，
--       旧的字段比较 skip 条件把合法的员工操作当成"无变化"跳过了。
-- 修复：depth > 1 说明是级联系统更新（totals 重算），才跳过；
--       depth = 1 说明是用户直接提交，始终生成通知。

create or replace function public.create_notification_for_production_order()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  actor_id uuid;
  actor_display_name text;
begin
  actor_id := public.current_employee_id();

  if actor_id is null then
    return new;
  end if;

  select e.name
  into actor_display_name
  from public.employees e
  where e.id = actor_id;

  if actor_display_name is null or btrim(actor_display_name) = '' then
    return new;
  end if;

  -- 只跳过级联系统触发（如 totals 重算），depth=1 为用户直接操作
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1 then
    return new;
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
    case when tg_op = 'INSERT' then 'create' else 'update' end
  );

  return new;
end;
$$;

create or replace function public.create_notification_for_material_transfer()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  actor_id uuid;
  actor_display_name text;
begin
  actor_id := public.current_employee_id();

  if actor_id is null then
    return new;
  end if;

  select e.name
  into actor_display_name
  from public.employees e
  where e.id = actor_id;

  if actor_display_name is null or btrim(actor_display_name) = '' then
    return new;
  end if;

  -- 跳过级联系统触发
  if tg_op = 'UPDATE' and pg_trigger_depth() > 1 then
    return new;
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
    case when tg_op = 'INSERT' then 'create' else 'update' end
  );

  return new;
end;
$$;
