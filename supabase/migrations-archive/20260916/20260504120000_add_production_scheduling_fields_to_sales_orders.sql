alter table public.sales_orders
add column if not exists order_date date,
  add column if not exists planned_start_date date,
  add column if not exists planned_finish_date date,
  add column if not exists delivery_review_result text,
  add column if not exists process_requirement text,
  add column if not exists tooling_status text,
  add column if not exists capacity_per_day numeric,
  add column if not exists bottleneck_processes text,
  add column if not exists material_status text,
  add column if not exists order_category text,
  add column if not exists delivery_priority text,
  add column if not exists scheduling_remark text,
  add column if not exists process_schedules jsonb not null default '[]'::jsonb;
alter table public.sales_orders drop constraint if exists sales_orders_process_schedules_array_check;
alter table public.sales_orders
add constraint sales_orders_process_schedules_array_check check (jsonb_typeof(process_schedules) = 'array');
create index if not exists idx_sales_orders_order_date on public.sales_orders (order_date);
create index if not exists idx_sales_orders_planned_start_date on public.sales_orders (planned_start_date);
create index if not exists idx_sales_orders_planned_finish_date on public.sales_orders (planned_finish_date);
comment on column public.sales_orders.order_date is '订单日期，对应订单初审/排产表中的订单日期';
comment on column public.sales_orders.planned_start_date is '计划开工日期';
comment on column public.sales_orders.planned_finish_date is '计划完成日期';
comment on column public.sales_orders.delivery_review_result is '交期评审结果';
comment on column public.sales_orders.process_requirement is '工艺要求说明';
comment on column public.sales_orders.tooling_status is '工装夹具情况';
comment on column public.sales_orders.capacity_per_day is '评审产能';
comment on column public.sales_orders.bottleneck_processes is '瓶颈工序';
comment on column public.sales_orders.material_status is '物料状态';
comment on column public.sales_orders.order_category is '订单类别归类';
comment on column public.sales_orders.delivery_priority is '订单交期紧急程度';
comment on column public.sales_orders.scheduling_remark is '订单排产备注';
comment on column public.sales_orders.process_schedules is '订单工序排产明细 JSON 数组';
update public.permissions
set label = '订单现状菜单'
where key = 'nav:production-scheduling';
update public.permissions
set label = '订单现状'
where key = 'page:production-scheduling';
insert into public.permissions (key, scope, module, surface, label)
values (
    'nav:order-scheduling',
    'nav',
    'order-scheduling',
    'pc',
    '订单排产菜单'
  ),
  (
    'page:order-scheduling',
    'page',
    'order-scheduling',
    'pc',
    '订单排产'
  ) on conflict (key) do
update
set scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label;