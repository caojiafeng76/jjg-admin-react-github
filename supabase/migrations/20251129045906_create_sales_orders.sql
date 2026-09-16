create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  product_delivery_date date not null,
  project_no text,
  product_model text,
  length_mm numeric(10,2),
  customer_model text,
  order_quantity integer,
  weight_per_meter_kg numeric(10,4),
  color_name text,
  package_name text,
  product_category text,
  material_name text,
  material_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sales_orders_project_no on public.sales_orders(project_no);
create index if not exists idx_sales_orders_product_delivery_date on public.sales_orders(product_delivery_date);
;
