-- Security baseline for the villa-lift process records and reporting views.
--
-- Compatibility note: the two record tables (and villa_lift_orders) currently
-- exist in the linked database but have no CREATE TABLE migration in this
-- repository. This migration intentionally references those tables directly
-- instead of masking the schema drift with guards or guessed table definitions.
-- A fresh local reset remains blocked until the missing baseline is imported.

alter table public.villa_lift_finishing_records enable row level security;
alter table public.villa_lift_cutting_records enable row level security;

drop policy "allow_authenticated_all"
on public.villa_lift_cutting_records;

create policy "villa_lift_finishing_select"
on public.villa_lift_finishing_records
for select
to authenticated
using (
  (select public.current_user_has_permission('page:villa-lift-processing'))
);

create policy "villa_lift_finishing_insert"
on public.villa_lift_finishing_records
for insert
to authenticated
with check (
  (select public.current_user_has_permission('feature:villa-lift-finishing.create'))
);

create policy "villa_lift_finishing_update"
on public.villa_lift_finishing_records
for update
to authenticated
using (
  (select public.current_user_has_permission('feature:villa-lift-finishing.edit'))
)
with check (
  (select public.current_user_has_permission('feature:villa-lift-finishing.edit'))
);

create policy "villa_lift_finishing_delete"
on public.villa_lift_finishing_records
for delete
to authenticated
using (
  (select public.current_user_has_permission('feature:villa-lift-finishing.delete'))
);

create policy "villa_lift_cutting_select"
on public.villa_lift_cutting_records
for select
to authenticated
using (
  (select public.current_user_has_permission('page:villa-lift-cutting-process'))
);

create policy "villa_lift_cutting_insert"
on public.villa_lift_cutting_records
for insert
to authenticated
with check (
  (select public.current_user_has_permission('feature:villa-lift-cutting.create'))
);

create policy "villa_lift_cutting_update"
on public.villa_lift_cutting_records
for update
to authenticated
using (
  (select public.current_user_has_permission('feature:villa-lift-cutting.edit'))
)
with check (
  (select public.current_user_has_permission('feature:villa-lift-cutting.edit'))
);

create policy "villa_lift_cutting_delete"
on public.villa_lift_cutting_records
for delete
to authenticated
using (
  (select public.current_user_has_permission('feature:villa-lift-cutting.delete'))
);

-- The reporting views join employees, whose row contains salary-sensitive
-- fields. Keep employees RLS narrow and expose only the existing view columns
-- through permission-gated, non-exposed functions.
create schema private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.get_attendance_details_with_shift()
returns table (
  id uuid,
  name text,
  date date,
  "time" time without time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  shift text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    ad.id::uuid,
    ad.name::text,
    ad.date::date,
    ad."time"::time without time zone,
    ad.created_at::timestamp with time zone,
    ad.updated_at::timestamp with time zone,
    coalesce(po.shift, '白班')::text as shift
  from public.attendance_details as ad
  left join public.employees as e
    on e.name::text = ad.name::text
  left join public.production_orders as po
    on po.employee_id = e.id
    and po.order_date = ad.date
  where (select auth.role()) = 'service_role'
    or (
      (select auth.uid()) is not null
      and (
        (select public.current_user_has_permission('page:attendance-detail'))
        or (select public.current_user_has_permission('page:attendance-summary'))
      )
    )
$function$;

create or replace function private.get_machine_runtime_items()
returns table (
  id uuid,
  order_id uuid,
  project_no text,
  product_model text,
  customer_model text,
  length_mm numeric(10, 2),
  operation text,
  incoming_qualified_quantity integer,
  theoretical_seconds double precision,
  machine_equipment_id uuid,
  runtime_seconds double precision,
  order_date date,
  employee_id uuid,
  operator_name character varying(100),
  unified_device_no text,
  device_operation text,
  machine_name text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    poi.id::uuid,
    poi.order_id::uuid,
    poi.project_no::text,
    poi.product_model::text,
    poi.customer_model::text,
    poi.length_mm::numeric(10, 2),
    poi.operation::text,
    poi.incoming_qualified_quantity::integer,
    poi.theoretical_seconds::double precision,
    poi.machine_equipment_id::uuid,
    (
      poi.incoming_qualified_quantity::double precision
      * poi.theoretical_seconds::double precision
    )::double precision as runtime_seconds,
    po.order_date::date,
    po.employee_id::uuid,
    e.name::character varying(100) as operator_name,
    me.unified_device_no::text,
    me.operation::text as device_operation,
    me.machine_name::text
  from public.production_order_items as poi
  left join public.production_orders as po
    on poi.order_id = po.id
  left join public.employees as e
    on po.employee_id = e.id
  left join public.machine_equipment_maintenances as me
    on poi.machine_equipment_id = me.id
  where (select auth.role()) = 'service_role'
    or (
      (select auth.uid()) is not null
      and (select public.current_user_has_permission('page:machine-runtime'))
    )
$function$;

revoke all on function private.get_attendance_details_with_shift()
from public, anon;
revoke all on function private.get_machine_runtime_items()
from public, anon;

grant execute on function private.get_attendance_details_with_shift()
to authenticated, service_role;
grant execute on function private.get_machine_runtime_items()
to authenticated, service_role;

create or replace view public.attendance_details_with_shift
with (security_invoker = true)
as
select
  report.id,
  report.name,
  report.date,
  report."time",
  report.created_at,
  report.updated_at,
  report.shift
from private.get_attendance_details_with_shift() as report;

create or replace view public.v_machine_runtime_items
with (security_invoker = true)
as
select
  report.id,
  report.order_id,
  report.project_no,
  report.product_model,
  report.customer_model,
  report.length_mm::numeric(10, 2) as length_mm,
  report.operation,
  report.incoming_qualified_quantity,
  report.theoretical_seconds,
  report.machine_equipment_id,
  report.runtime_seconds,
  report.order_date,
  report.employee_id,
  report.operator_name::character varying(100) as operator_name,
  report.unified_device_no,
  report.device_operation,
  report.machine_name
from private.get_machine_runtime_items() as report;

grant select on public.attendance_details_with_shift
to authenticated, service_role;
grant select on public.v_machine_runtime_items
to authenticated, service_role;
