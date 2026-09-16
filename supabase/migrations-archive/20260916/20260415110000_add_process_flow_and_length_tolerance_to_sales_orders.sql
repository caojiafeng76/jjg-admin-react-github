alter table public.sales_orders
add column if not exists process_flow text,
  add column if not exists length_tolerance text;
comment on column public.sales_orders.process_flow is '工艺流程，如：切割->冲孔->CNC';
comment on column public.sales_orders.length_tolerance is '长度公差，如：±0.2';