-- Replace the original authenticated-wide Syney policies with RBAC policies.
-- current_user_has_permission() already rejects unbound and inactive users.

alter table public."syney-pos" enable row level security;
alter table public."syney-po-items" enable row level security;
alter table public."syney-serial-no" enable row level security;
alter table public."syney-specs" enable row level security;
alter table public."syney-store-reports" enable row level security;
alter table public."syney-store-report-items" enable row level security;

drop policy if exists "Syney pos authenticated rw" on public."syney-pos";
drop policy if exists "Syney po items authenticated rw" on public."syney-po-items";
drop policy if exists "Syney serial no authenticated rw" on public."syney-serial-no";
drop policy if exists "Syney specs authenticated rw" on public."syney-specs";
drop policy if exists "Syney store reports authenticated rw" on public."syney-store-reports";
drop policy if exists "Syney store report items authenticated rw" on public."syney-store-report-items";

drop policy if exists "syney_pos_select" on public."syney-pos";
drop policy if exists "syney_pos_insert" on public."syney-pos";
drop policy if exists "syney_pos_update" on public."syney-pos";
drop policy if exists "syney_pos_delete" on public."syney-pos";

create policy "syney_pos_select"
on public."syney-pos"
for select
to authenticated
using (
  (select public.current_user_has_permission('page:syney-po-list'))
);

create policy "syney_pos_insert"
on public."syney-pos"
for insert
to authenticated
with check (
  (select public.current_user_has_permission('feature:syney-po-list.create'))
);

create policy "syney_pos_update"
on public."syney-pos"
for update
to authenticated
using (
  (select public.current_user_has_permission('feature:syney-po-list.edit'))
)
with check (
  (select public.current_user_has_permission('feature:syney-po-list.edit'))
);

create policy "syney_pos_delete"
on public."syney-pos"
for delete
to authenticated
using (
  (select public.current_user_has_permission('feature:syney-po-list.delete'))
);

drop policy if exists "syney_po_items_select" on public."syney-po-items";
drop policy if exists "syney_po_items_insert" on public."syney-po-items";
drop policy if exists "syney_po_items_update" on public."syney-po-items";
drop policy if exists "syney_po_items_delete" on public."syney-po-items";

create policy "syney_po_items_select"
on public."syney-po-items"
for select
to authenticated
using (
  (select public.current_user_has_permission('page:syney-po-list'))
);

create policy "syney_po_items_insert"
on public."syney-po-items"
for insert
to authenticated
with check (
  (select public.current_user_has_permission('feature:syney-po-list.create'))
);

create policy "syney_po_items_update"
on public."syney-po-items"
for update
to authenticated
using (
  (select public.current_user_has_permission('feature:syney-po-list.edit'))
)
with check (
  (select public.current_user_has_permission('feature:syney-po-list.edit'))
);

create policy "syney_po_items_delete"
on public."syney-po-items"
for delete
to authenticated
using (
  (select public.current_user_has_permission('feature:syney-po-list.delete'))
);

drop policy if exists "syney_serial_no_manage" on public."syney-serial-no";

create policy "syney_serial_no_manage"
on public."syney-serial-no"
for all
to authenticated
using (
  (select public.current_user_has_permission('page:syney-setting'))
)
with check (
  (select public.current_user_has_permission('page:syney-setting'))
);

drop policy if exists "syney_specs_select" on public."syney-specs";
drop policy if exists "syney_specs_insert" on public."syney-specs";
drop policy if exists "syney_specs_update" on public."syney-specs";
drop policy if exists "syney_specs_delete" on public."syney-specs";

create policy "syney_specs_select"
on public."syney-specs"
for select
to authenticated
using (
  (select public.current_user_has_permission('page:syney-spec-list'))
  or (select public.current_user_has_permission('page:syney-store-report-list'))
);

create policy "syney_specs_insert"
on public."syney-specs"
for insert
to authenticated
with check (
  (select public.current_user_has_permission('page:syney-spec-list'))
  or (select public.current_user_has_permission('page:syney-store-report-list'))
  or (select public.current_user_has_permission('feature:syney-po-list.edit'))
);

create policy "syney_specs_update"
on public."syney-specs"
for update
to authenticated
using (
  (select public.current_user_has_permission('page:syney-spec-list'))
)
with check (
  (select public.current_user_has_permission('page:syney-spec-list'))
);

create policy "syney_specs_delete"
on public."syney-specs"
for delete
to authenticated
using (
  (select public.current_user_has_permission('page:syney-spec-list'))
);

drop policy if exists "syney_store_reports_manage" on public."syney-store-reports";

create policy "syney_store_reports_manage"
on public."syney-store-reports"
for all
to authenticated
using (
  (select public.current_user_has_permission('page:syney-store-report-list'))
)
with check (
  (select public.current_user_has_permission('page:syney-store-report-list'))
);

drop policy if exists "syney_store_report_items_manage" on public."syney-store-report-items";

create policy "syney_store_report_items_manage"
on public."syney-store-report-items"
for all
to authenticated
using (
  (select public.current_user_has_permission('page:syney-store-report-list'))
)
with check (
  (select public.current_user_has_permission('page:syney-store-report-list'))
);

-- The underlying sales_orders policy is legacy-wide because many independent
-- pages consume that table. Keep this narrowly scoped RPC permission-gated.
create or replace function public.get_workshop_order_options()
returns table (
  project_nos text[],
  product_models text[],
  lengths numeric[]
)
language plpgsql
stable
security invoker
set search_path = ''
as $function$
begin
  if (select auth.role()) <> 'service_role'
    and not (
      (select public.current_user_has_permission('page:workshop-order-production'))
      or (select public.current_user_has_permission('page:workshop-order-closed'))
    )
  then
    raise exception using
      errcode = '42501',
      message = 'Workshop order page permission is required';
  end if;

  return query
  select
    coalesce(
      array_agg(distinct btrim(sales_order.project_no) order by btrim(sales_order.project_no))
        filter (
          where sales_order.project_no is not null
            and btrim(sales_order.project_no) <> ''
        ),
      array[]::text[]
    ) as project_nos,
    coalesce(
      array_agg(distinct btrim(sales_order.product_model) order by btrim(sales_order.product_model))
        filter (
          where sales_order.product_model is not null
            and btrim(sales_order.product_model) <> ''
        ),
      array[]::text[]
    ) as product_models,
    coalesce(
      array_agg(distinct sales_order.length_mm order by sales_order.length_mm)
        filter (where sales_order.length_mm is not null),
      array[]::numeric[]
    ) as lengths
  from public.sales_orders as sales_order;
end
$function$;

revoke all on function public.get_workshop_order_options() from public, anon;
grant execute on function public.get_workshop_order_options()
to authenticated, service_role;
