alter table public.sales_orders
  add column if not exists completion_reached_at timestamptz,
  add column if not exists auto_close_disabled boolean not null default false;

comment on column public.sales_orders.completion_reached_at is
  '订单当前连续达到 100% 出库完成度的起始时间；跌破 100% 后清空';
comment on column public.sales_orders.auto_close_disabled is
  '订单被反结案后永久禁用自动结案';

create index if not exists sales_orders_auto_close_eligibility_idx
  on public.sales_orders (completion_reached_at)
  where status = '生产中' and auto_close_disabled = false;

create schema if not exists private;

create or replace function private.refresh_workshop_order_completion(
  target_project_no text,
  reached_at timestamptz default now()
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  outbound_total bigint;
begin
  if nullif(btrim(target_project_no), '') is null then
    return;
  end if;

  perform 1
  from public.sales_orders
  where btrim(project_no) = btrim(target_project_no)
  for update;

  select coalesce(sum(transfer_quantity), 0)
  into outbound_total
  from public.material_transfers
  where btrim(project_no) = btrim(target_project_no);

  update public.sales_orders
  set completion_reached_at = case
    when order_quantity > 0 and outbound_total >= order_quantity
      then coalesce(completion_reached_at, reached_at, now())
    else null
  end
  where btrim(project_no) = btrim(target_project_no)
    and completion_reached_at is distinct from case
      when order_quantity > 0 and outbound_total >= order_quantity
        then coalesce(completion_reached_at, reached_at, now())
      else null
    end;
end;
$$;

create or replace function private.sync_workshop_order_completion_from_transfer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_workshop_order_completion(old.project_no, now());
    return old;
  end if;

  if tg_op = 'UPDATE'
    and btrim(old.project_no) is distinct from btrim(new.project_no) then
    perform private.refresh_workshop_order_completion(old.project_no, now());
  end if;

  perform private.refresh_workshop_order_completion(new.project_no, now());
  return new;
end;
$$;

drop trigger if exists sync_workshop_order_completion_from_transfer
  on public.material_transfers;
create trigger sync_workshop_order_completion_from_transfer
after insert or delete or update of project_no, transfer_quantity
on public.material_transfers
for each row
execute function private.sync_workshop_order_completion_from_transfer();

create or replace function private.sync_workshop_order_completion_from_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and btrim(old.project_no) is distinct from btrim(new.project_no) then
    perform private.refresh_workshop_order_completion(old.project_no, now());
  end if;

  perform private.refresh_workshop_order_completion(new.project_no, now());
  return new;
end;
$$;

drop trigger if exists sync_workshop_order_completion_from_order
  on public.sales_orders;
create trigger sync_workshop_order_completion_from_order
after insert or update of project_no, order_quantity
on public.sales_orders
for each row
execute function private.sync_workshop_order_completion_from_order();

create or replace function private.mark_workshop_order_reopened()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = '已结案' and new.status = '生产中' then
    new.auto_close_disabled = true;
  end if;

  return new;
end;
$$;

drop trigger if exists mark_workshop_order_reopened on public.sales_orders;
create trigger mark_workshop_order_reopened
before update of status
on public.sales_orders
for each row
when (old.status is distinct from new.status)
execute function private.mark_workshop_order_reopened();

create or replace function private.close_eligible_workshop_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  closed_count integer;
begin
  update public.sales_orders as orders
  set status = '已结案'
  where orders.status = '生产中'
    and not orders.auto_close_disabled
    and orders.order_quantity > 0
    and orders.completion_reached_at <= now() - interval '2 days'
    and (
      select coalesce(sum(transfers.transfer_quantity), 0)
      from public.material_transfers as transfers
      where btrim(transfers.project_no) = btrim(orders.project_no)
    ) >= orders.order_quantity;

  get diagnostics closed_count = row_count;
  return closed_count;
end;
$$;

revoke all on function private.refresh_workshop_order_completion(text, timestamptz)
  from public, anon, authenticated;
revoke all on function private.sync_workshop_order_completion_from_transfer()
  from public, anon, authenticated;
revoke all on function private.sync_workshop_order_completion_from_order()
  from public, anon, authenticated;
revoke all on function private.mark_workshop_order_reopened()
  from public, anon, authenticated;
revoke all on function private.close_eligible_workshop_orders()
  from public, anon, authenticated;

with running_transfers as (
  select
    btrim(transfers.project_no) as project_no,
    transfers.created_at,
    transfers.id,
    sum(transfers.transfer_quantity) over (
      partition by btrim(transfers.project_no)
      order by transfers.created_at, transfers.id
      rows between unbounded preceding and current row
    ) as cumulative_quantity
  from public.material_transfers as transfers
), reached_completion as (
  select
    so.id,
    min(running.created_at) filter (
      where running.cumulative_quantity >= so.order_quantity
    ) as completion_reached_at
  from public.sales_orders as so
  left join running_transfers as running
    on running.project_no = btrim(so.project_no)
  where so.status = '生产中'
    and so.order_quantity > 0
  group by so.id, so.order_quantity
)
update public.sales_orders as orders
set completion_reached_at = reached.completion_reached_at,
  auto_close_disabled = false
from reached_completion as reached
where orders.id = reached.id
  and orders.status = '生产中'
  and orders.completion_reached_at is distinct from reached.completion_reached_at;

select private.close_eligible_workshop_orders();

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'workshop-order-auto-close';

  perform cron.schedule(
    'workshop-order-auto-close',
    '*/15 * * * *',
    'select private.close_eligible_workshop_orders();'
  );
end;
$$;
