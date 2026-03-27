create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  actor_employee_id uuid not null references public.employees (id) on update cascade on delete restrict,
  actor_name text not null,
  entity_type text not null,
  entity_id uuid not null,
  action_type text not null,
  is_read boolean not null default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint notifications_actor_name_not_blank check (btrim(actor_name) <> ''),
  constraint notifications_entity_type_check check (
    entity_type in ('production_order', 'material_transfer')
  ),
  constraint notifications_action_type_check check (
    action_type in ('create', 'update')
  )
);

comment on table public.notifications is '管理员通知';
comment on column public.notifications.actor_employee_id is '触发通知的员工ID';
comment on column public.notifications.actor_name is '触发通知的员工姓名快照';
comment on column public.notifications.entity_type is '业务类型：production_order / material_transfer';
comment on column public.notifications.entity_id is '业务记录ID';
comment on column public.notifications.action_type is '动作类型：create / update';
comment on column public.notifications.is_read is '是否已读';
comment on column public.notifications.read_at is '已读时间';

create index if not exists idx_notifications_created_at_desc
on public.notifications (created_at desc);

create index if not exists idx_notifications_unread_created_at
on public.notifications (is_read, created_at desc);

create or replace function public.sync_notification_read_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_read is true then
    if tg_op = 'INSERT' then
      new.read_at = coalesce(new.read_at, now());
    elsif old.is_read is distinct from new.is_read then
      new.read_at = coalesce(new.read_at, now());
    end if;
  else
    new.read_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_notification_read_at on public.notifications;
create trigger sync_notification_read_at
before insert or update of is_read, read_at on public.notifications
for each row
execute function public.sync_notification_read_at();

create or replace function public.create_notification_for_production_order()
returns trigger
language plpgsql
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

  if tg_op = 'UPDATE'
    and new.order_date is not distinct from old.order_date
    and new.employee_id is not distinct from old.employee_id
    and new.work_hours is not distinct from old.work_hours
    and new.extra_qualified_hours is not distinct from old.extra_qualified_hours
    and new.remark is not distinct from old.remark
    and new.is_audited is not distinct from old.is_audited
    and new.audited_at is not distinct from old.audited_at
    and new.shift is not distinct from old.shift then
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

drop trigger if exists create_notification_for_production_order on public.production_orders;
create trigger create_notification_for_production_order
after insert or update on public.production_orders
for each row
execute function public.create_notification_for_production_order();

create or replace function public.create_notification_for_material_transfer()
returns trigger
language plpgsql
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

  if tg_op = 'UPDATE'
    and new.project_no is not distinct from old.project_no
    and new.customer is not distinct from old.customer
    and new.product_model is not distinct from old.product_model
    and new.length_mm is not distinct from old.length_mm
    and new.customer_model is not distinct from old.customer_model
    and new.transfer_quantity is not distinct from old.transfer_quantity
    and new.operator_employee_id is not distinct from old.operator_employee_id
    and new.operator_employee_ids is not distinct from old.operator_employee_ids
    and new.operator_names is not distinct from old.operator_names
    and new.target_workshop is not distinct from old.target_workshop
    and new.recipient_name is not distinct from old.recipient_name
    and new.shift_leader_name is not distinct from old.shift_leader_name
    and new.inspector_name is not distinct from old.inspector_name
    and new.uploaded_by_name is not distinct from old.uploaded_by_name
    and new.remark is not distinct from old.remark
    and new.is_audited is not distinct from old.is_audited
    and new.audited_at is not distinct from old.audited_at then
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

drop trigger if exists create_notification_for_material_transfer on public.material_transfers;
create trigger create_notification_for_material_transfer
after insert or update on public.material_transfers
for each row
execute function public.create_notification_for_material_transfer();

alter table public.notifications enable row level security;

drop policy if exists "Notifications insert own" on public.notifications;
create policy "Notifications insert own" on public.notifications
for insert to authenticated
with check (actor_employee_id = public.current_employee_id());

drop policy if exists "Notifications admin select all" on public.notifications;
create policy "Notifications admin select all" on public.notifications
for select to authenticated
using (public.is_admin());

drop policy if exists "Notifications admin update all" on public.notifications;
create policy "Notifications admin update all" on public.notifications
for update to authenticated
using (public.is_admin())
with check (public.is_admin());