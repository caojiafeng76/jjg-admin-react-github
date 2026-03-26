alter table public.production_order_items
add constraint production_order_items_incoming_qualified_quantity_check check (
  incoming_qualified_quantity >= coalesce(qualified_quantity, 0) + coalesce(defect_quantity_1, 0) + coalesce(defect_quantity_2, 0)
) not valid;

alter table public.production_order_items
validate constraint production_order_items_incoming_qualified_quantity_check;
