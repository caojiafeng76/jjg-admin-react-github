alter table public.sales_orders
drop constraint if exists sales_orders_non_empty_order_check;

alter table public.sales_orders
add constraint sales_orders_non_empty_order_check
check (
  coalesce(nullif(btrim(project_no), ''), null) is not null
  or coalesce(nullif(btrim(product_model), ''), null) is not null
  or coalesce(nullif(btrim(customer_model), ''), null) is not null
  or coalesce(nullif(btrim(customer), ''), null) is not null
  or coalesce(nullif(btrim(process_flow), ''), null) is not null
  or coalesce(nullif(btrim(material_code), ''), null) is not null
  or length_mm is not null
  or order_quantity is not null
  or weight_per_meter_kg is not null
) not valid;

comment on constraint sales_orders_non_empty_order_check on public.sales_orders is
'禁止插入全字段为空、仅剩默认状态的空白订单记录';;
