update public.sales_orders
set closed_at = null
where status = '已结案'
  and closed_at is not null
  and updated_at is not null
  and closed_at = updated_at;