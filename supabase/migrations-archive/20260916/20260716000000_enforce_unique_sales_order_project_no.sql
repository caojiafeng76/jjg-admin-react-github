create unique index sales_orders_project_no_unique_idx
on public.sales_orders ((nullif(btrim(project_no), '')))
where nullif(btrim(project_no), '') is not null;
