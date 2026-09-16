create index if not exists idx_sales_orders_status_created_project_no on public.sales_orders (status, created_at desc, project_no);
create index if not exists idx_production_order_items_project_no_non_b on public.production_order_items (project_no)
where data_category <> 'B';