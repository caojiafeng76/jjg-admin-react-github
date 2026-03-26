alter table public.sales_orders
add column if not exists customer text;

comment on column public.sales_orders.customer is '客户名称';