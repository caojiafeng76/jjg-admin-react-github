alter table public.sales_orders
  add column if not exists responsible_person text,
  add column if not exists progress_status text,
  add column if not exists progress_percent numeric;

comment on column public.sales_orders.responsible_person is '订单排产基础版：负责班组或人员';
comment on column public.sales_orders.progress_status is '订单排产基础版：当前进度状态（未开工、进行中、已完工、延期）';
comment on column public.sales_orders.progress_percent is '订单排产基础版：进行中进度百分比';
