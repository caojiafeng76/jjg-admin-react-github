alter table public.production_order_items
add column if not exists data_category text;
update public.production_order_items
set data_category = 'A'
where data_category is null;
alter table public.production_order_items
alter column data_category
set default 'A';
alter table public.production_order_items
alter column data_category
set not null;
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'production_order_items_data_category_check'
) then
alter table public.production_order_items
add constraint production_order_items_data_category_check check (data_category in ('A', 'B'));
end if;
end $$;
comment on column public.production_order_items.data_category is '数据类别：A / B';