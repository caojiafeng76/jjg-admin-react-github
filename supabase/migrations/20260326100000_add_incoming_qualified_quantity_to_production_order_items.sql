alter table public.production_order_items
add column incoming_qualified_quantity integer;

comment on column public.production_order_items.incoming_qualified_quantity is '来料合格数';

update public.production_order_items
set incoming_qualified_quantity = coalesce(qualified_quantity, 0) + coalesce(defect_quantity_1, 0) + coalesce(defect_quantity_2, 0)
where incoming_qualified_quantity is null;

alter table public.production_order_items
alter column incoming_qualified_quantity set not null;
