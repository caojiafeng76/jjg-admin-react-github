create or replace function public.get_workshop_order_options()
returns table (
  project_nos text[],
  product_models text[],
  lengths numeric[]
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    coalesce(
      array_agg(distinct btrim(project_no) order by btrim(project_no))
        filter (where project_no is not null and btrim(project_no) <> ''),
      array[]::text[]
    ) as project_nos,
    coalesce(
      array_agg(distinct btrim(product_model) order by btrim(product_model))
        filter (where product_model is not null and btrim(product_model) <> ''),
      array[]::text[]
    ) as product_models,
    coalesce(
      array_agg(distinct length_mm order by length_mm)
        filter (where length_mm is not null),
      array[]::numeric[]
    ) as lengths
  from public.sales_orders;
$function$;

revoke all on function public.get_workshop_order_options() from public, anon;
grant execute on function public.get_workshop_order_options()
  to authenticated, service_role;
