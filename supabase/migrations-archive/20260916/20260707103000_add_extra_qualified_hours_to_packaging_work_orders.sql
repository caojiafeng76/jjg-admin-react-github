alter table public.packaging_work_orders
add column if not exists extra_qualified_hours numeric(10, 2) not null default 0
check (extra_qualified_hours >= 0);

comment on column public.packaging_work_orders.extra_qualified_hours is
  '包装生产工单零工工时（小时）';
