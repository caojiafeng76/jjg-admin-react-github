alter table public.production_orders
drop constraint if exists production_orders_work_hours_check;

alter table public.production_orders
add constraint production_orders_work_hours_check
check (work_hours >= 0);;
