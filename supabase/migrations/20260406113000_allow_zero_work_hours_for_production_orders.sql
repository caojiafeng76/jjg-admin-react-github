alter table public.production_orders
drop constraint if exists production_orders_work_hours_check;

alter table public.production_orders
add constraint production_orders_work_hours_check
check (work_hours >= 0);

comment on constraint production_orders_work_hours_check on public.production_orders is '出勤工时允许为0，但不能为负数';