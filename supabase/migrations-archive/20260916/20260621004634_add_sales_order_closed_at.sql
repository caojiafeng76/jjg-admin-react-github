alter table public.sales_orders
add column if not exists closed_at timestamptz;
comment on column public.sales_orders.closed_at is '订单结案时间，状态改为已结案时写入，改回生产中时清空';
create or replace function public.set_sales_order_closed_at() returns trigger language plpgsql as $$ begin if new.status = '已结案' then if tg_op = 'INSERT' then new.closed_at = coalesce(new.closed_at, now());
elsif old.status is distinct
from new.status then new.closed_at = coalesce(new.closed_at, now());
else new.closed_at = coalesce(old.closed_at, new.closed_at, now());
end if;
elsif new.status = '生产中' then new.closed_at = null;
end if;
return new;
end;
$$;
drop trigger if exists set_sales_order_closed_at on public.sales_orders;
create trigger set_sales_order_closed_at before
insert
  or
update of status on public.sales_orders for each row execute function public.set_sales_order_closed_at();