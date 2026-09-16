alter table public.sales_orders
add column if not exists status text;
update public.sales_orders
set status = '生产中'
where status is null;
alter table public.sales_orders
alter column status
set default '生产中',
  alter column status
set not null;
alter table public.sales_orders drop constraint if exists sales_orders_status_check;
alter table public.sales_orders
add constraint sales_orders_status_check check (status in ('生产中', '已结案'));
comment on column public.sales_orders.status is '订单状态：生产中/已结案';