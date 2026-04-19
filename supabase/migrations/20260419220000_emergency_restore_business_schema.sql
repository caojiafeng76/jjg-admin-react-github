-- Emergency schema-only restore for business tables dropped from remote public schema.
-- Goal: bring active pages back to a non-missing-table state.
-- Scope: recreate empty tables, the minimum PostgREST relationships used by the app,
-- and a few directly called views/RPCs. Historical data and full trigger/RLS parity are
-- intentionally out of scope for this repair.
create table if not exists public.attendance_details (
  created_at timestamptz not null default now(),
  date date not null,
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  time time not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.job_base_settings (
  created_at timestamptz not null default now(),
  daily_work_hours numeric not null default 0,
  hourly_fee numeric,
  id uuid not null default gen_random_uuid() primary key,
  job_name text not null,
  monthly_standard_hours numeric,
  standard_income numeric not null default 0,
  updated_at timestamptz not null default now(),
  working_days numeric not null default 0
);
create table if not exists public.machine_equipment_maintenances (
  annual_runtime_hours numeric not null default 0,
  created_at timestamptz not null default now(),
  customer text,
  depreciation_rate numeric,
  depreciation_years numeric not null default 0,
  electricity_unit_price numeric not null default 0,
  equipment_hourly_rate numeric,
  hourly_electricity_fee numeric,
  id uuid not null default gen_random_uuid() primary key,
  machine_name text not null,
  machine_value numeric not null default 0,
  operation text not null,
  original_no text,
  power_kw numeric not null default 0,
  remark text,
  sync_work_quantity numeric not null default 0,
  unified_device_no text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.material_transfers (
  audited_at timestamptz,
  created_at timestamptz not null default now(),
  customer text,
  customer_model text,
  id uuid not null default gen_random_uuid() primary key,
  inspector_name text,
  is_audited boolean not null default false,
  length_mm numeric,
  operator_employee_id uuid not null,
  operator_employee_ids text [] not null default '{}'::text [],
  operator_names text [] not null default '{}'::text [],
  product_model text,
  project_no text not null,
  recipient_name text not null,
  remark text,
  shift_leader_name text,
  target_workshop text not null,
  transfer_quantity numeric not null default 0,
  updated_at timestamptz not null default now(),
  uploaded_by_name text
);
create table if not exists public.precision_cutting_transfers (
  audited_at timestamptz,
  created_at timestamptz not null default now(),
  customer text,
  customer_model text,
  defect_reason text,
  id uuid not null default gen_random_uuid() primary key,
  inspector_name text,
  is_audited boolean not null default false,
  length_mm numeric,
  long_material_length_mm numeric not null default 0,
  long_material_quantity numeric not null default 0,
  operator_names text [] not null default '{}'::text [],
  outsource_defect_quantity numeric not null default 0,
  outsource_defect_reason text,
  outsource_unit text,
  process_owner text,
  processing_defect_count numeric not null default 0,
  product_model text,
  project_no text not null,
  raw_material_defect_count numeric not null default 0,
  recipient_name text not null,
  remark text,
  responsible_process text,
  target_workshop text not null,
  transfer_quantity numeric not null default 0,
  updated_at timestamptz not null default now(),
  uploaded_by_name text
);
create table if not exists public.precision_finishing_cuttings (
  audited_at timestamptz,
  created_at timestamptz not null default now(),
  customer text,
  customer_model text,
  defect_reason text,
  id uuid not null default gen_random_uuid() primary key,
  inspector_name text,
  is_audited boolean not null default false,
  length_mm numeric,
  long_material_length_mm numeric not null default 0,
  long_material_quantity numeric not null default 0,
  operator_employee_id uuid not null,
  operator_employee_ids text [] not null default '{}'::text [],
  operator_names text [] not null default '{}'::text [],
  outsource_defect_quantity numeric not null default 0,
  outsource_defect_reason text,
  outsource_unit text,
  process_owner text,
  processing_defect_count numeric not null default 0,
  product_model text,
  project_no text not null,
  raw_material_defect_count numeric not null default 0,
  recipient_name text not null,
  remark text,
  responsible_process text,
  target_workshop text not null,
  transfer_quantity numeric not null default 0,
  updated_at timestamptz not null default now(),
  uploaded_by_name text
);
create table if not exists public.process_standards (
  created_at timestamptz not null default now(),
  customer text,
  cutting_fluid_rate numeric not null default 0,
  daily_management_cost numeric not null default 0,
  daily_total_hours numeric not null default 0,
  equipment_cost numeric,
  equipment_no text,
  equipment_rate numeric not null default 0,
  fixture_rate numeric not null default 0,
  id uuid not null default gen_random_uuid() primary key,
  inspection_cost numeric,
  inspection_seconds numeric not null default 0,
  job_name text,
  labor_cost numeric,
  labor_cost_coefficient numeric not null default 1,
  labor_rate numeric not null default 0,
  length numeric not null default 0,
  model text not null,
  operation text not null,
  overhead_cost numeric,
  part_no text,
  record_type text not null default 'B',
  remark text,
  standard_seconds numeric not null default 0,
  theoretical_seconds numeric not null default 0,
  tool_rate numeric not null default 0,
  tooling_consumable_cost numeric,
  total_cost numeric,
  updated_at timestamptz not null default now(),
  uploaded_by_name text
);
create table if not exists public.production_daily_report_export_jobs (
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  error_message text,
  expires_at timestamptz,
  file_name text,
  file_path text,
  id uuid not null default gen_random_uuid() primary key,
  request_payload jsonb not null default '{}'::jsonb,
  requested_by_admin_employee_id uuid not null,
  started_at timestamptz,
  status text not null default 'pending',
  updated_at timestamptz not null default now()
);
create table if not exists public.production_order_export_jobs (
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  error_message text,
  expires_at timestamptz,
  file_name text,
  file_path text,
  id uuid not null default gen_random_uuid() primary key,
  request_payload jsonb not null default '{}'::jsonb,
  requested_by_admin_employee_id uuid not null,
  started_at timestamptz,
  status text not null default 'pending',
  updated_at timestamptz not null default now()
);
create table if not exists public.production_orders (
  audited_at timestamptz,
  created_at timestamptz not null default now(),
  efficiency numeric,
  employee_id uuid,
  extra_qualified_hours numeric not null default 0,
  id uuid not null default gen_random_uuid() primary key,
  is_audited boolean not null default false,
  order_date date not null default current_date,
  remark text,
  shift text not null default '白班',
  status text not null default '待审核',
  total_qualified_hours numeric,
  updated_at timestamptz not null default now(),
  work_hours numeric not null default 0
);
create table if not exists public.production_order_items (
  created_at timestamptz not null default now(),
  customer_model text,
  data_category text not null default 'B',
  defect_hours numeric,
  defect_quantity_1 numeric not null default 0,
  defect_quantity_2 numeric not null default 0,
  defect_reason_1 text,
  defect_reason_2 text,
  id uuid not null default gen_random_uuid() primary key,
  incoming_qualified_quantity numeric not null default 0,
  length_mm numeric,
  machine_equipment_id uuid,
  operation text not null,
  order_id uuid not null,
  outsource_defect_quantity numeric not null default 0,
  outsource_defect_reason text,
  outsource_unit text,
  product_model text,
  project_no text not null,
  qualified_hours numeric,
  qualified_quantity numeric not null default 0,
  remark text,
  setup_defect_quantity numeric not null default 0,
  setup_responsible text,
  standard_seconds numeric not null default 0,
  theoretical_seconds numeric not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.sales_orders (
  color_name text,
  created_at timestamptz default now(),
  customer text,
  customer_model text,
  id uuid not null default gen_random_uuid() primary key,
  length_mm numeric,
  length_tolerance text,
  material_code text,
  material_name text,
  order_quantity numeric,
  package_name text,
  process_flow text,
  product_category text,
  product_delivery_date date,
  product_model text,
  project_no text,
  status text not null default '生产中',
  updated_at timestamptz default now(),
  weight_per_meter_kg numeric
);
create table if not exists public.syney_safe_part_settings (
  created_at timestamptz default now(),
  decomposition_role text,
  english_name text,
  id uuid not null default gen_random_uuid() primary key,
  is_safe_part boolean not null default false,
  name text,
  need_print_label boolean not null default false,
  part_code_prefix text,
  part_model text,
  part_no text not null,
  remark text,
  updated_at timestamptz default now()
);
create table if not exists public."syney-pos" (
  "BorderMaterial" text not null default '',
  "Brand" text,
  created_at timestamptz not null default now(),
  "EndDate" text,
  id bigint generated by default as identity primary key,
  "No" text,
  "Qty" numeric,
  "Remark" text,
  "SerialNo" bigint,
  "SONo" text,
  "Spec" text,
  "Status" text,
  "Technique" text
);
create table if not exists public."syney-po-items" (
  created_at timestamptz not null default now(),
  id bigint generated by default as identity primary key,
  "No" text,
  "ParamSpec" text,
  "PartCode" text,
  "PartModel" text,
  "PartName" text,
  "PartName2" text,
  "PartNo" text,
  "PoId" bigint,
  "Qty" numeric,
  "Remark" text,
  "SONo" text,
  "Spec" text,
  "Unit" text
);
create table if not exists public."syney-serial-no" (
  created_at timestamptz not null default now(),
  id bigint primary key,
  "SyneySerialNo" bigint
);
create table if not exists public."syney-specs" (
  created_at timestamptz not null default now(),
  id bigint generated by default as identity primary key,
  "ParamSpec" text,
  "PartName" text,
  "PartNo" text,
  "Spec" text,
  "Unit" text
);
create table if not exists public."syney-store-reports" (
  created_at timestamptz not null default now(),
  id bigint generated by default as identity primary key,
  "No" text not null,
  "Status" text not null default '',
  "TotalAmount" numeric
);
create table if not exists public."syney-store-report-items" (
  created_at timestamptz not null default now(),
  id bigint generated by default as identity primary key,
  "No" text,
  "ParamSpec" text,
  "PartName" text,
  "PartNo" text,
  "Qty" numeric,
  "Remark" text,
  "SONo" text,
  "Spec" text,
  "TaxTotalPrice" numeric,
  "TaxUnitPrice" numeric,
  "Unit" text
);
create table if not exists public.tooling_data (
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  material text not null,
  remarks text not null,
  tool_code text not null,
  tool_name text not null,
  tool_spec text not null,
  unit_price numeric not null default 0,
  updated_at timestamptz not null default now(),
  usage text not null
);
create table if not exists public.youmai_product_data (
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  material_code text not null,
  material_name text not null,
  model text not null,
  remarks text not null,
  specific_gravity numeric not null default 0,
  specification text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.youmai_finished_goods_inventory (
  created_at timestamptz not null default now(),
  current_stock numeric not null default 0,
  final_stock numeric,
  id uuid not null default gen_random_uuid() primary key,
  material_code text not null,
  material_name text not null,
  model text not null,
  pending_stock_in numeric not null default 0,
  pending_stock_out numeric not null default 0,
  product_data_id uuid not null,
  remarks text not null,
  specific_gravity numeric not null default 0,
  specification text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.youmai_finished_goods_stock_in (
  created_at timestamptz not null default now(),
  id uuid not null default gen_random_uuid() primary key,
  material_code text not null,
  material_name text not null,
  model text not null,
  product_data_id uuid not null,
  remarks text not null,
  specific_gravity numeric not null default 0,
  specification text not null,
  status text not null default '待审核',
  stock_in_quantity numeric not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.youmai_finished_goods_stock_out (
  created_at timestamptz not null default now(),
  delivery_date date not null,
  id uuid not null default gen_random_uuid() primary key,
  material_code text not null,
  material_name text not null,
  model text not null,
  product_data_id uuid not null,
  purchase_order_line_no text not null,
  purchase_order_no text not null,
  remarks text not null,
  specific_gravity numeric not null default 0,
  specification text not null,
  status text not null default '待审核',
  stock_out_quantity numeric not null default 0,
  updated_at timestamptz not null default now()
);
create unique index if not exists job_base_settings_job_name_key on public.job_base_settings (job_name);
create unique index if not exists machine_equipment_maintenances_unified_device_no_key on public.machine_equipment_maintenances (unified_device_no);
create unique index if not exists syney_safe_part_settings_part_no_key on public.syney_safe_part_settings (part_no);
create unique index if not exists syney_store_reports_no_key on public."syney-store-reports" ("No");
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'production_orders_employee_id_fkey'
) then
alter table public.production_orders
add constraint production_orders_employee_id_fkey foreign key (employee_id) references public.employees(id) on delete
set null;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'production_order_items_order_id_fkey'
) then
alter table public.production_order_items
add constraint production_order_items_order_id_fkey foreign key (order_id) references public.production_orders(id) on delete cascade;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'production_order_items_machine_equipment_id_fkey'
) then
alter table public.production_order_items
add constraint production_order_items_machine_equipment_id_fkey foreign key (machine_equipment_id) references public.machine_equipment_maintenances(id) on delete
set null;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'material_transfers_operator_employee_id_fkey'
) then
alter table public.material_transfers
add constraint material_transfers_operator_employee_id_fkey foreign key (operator_employee_id) references public.employees(id);
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'precision_finishing_cuttings_operator_employee_id_fkey'
) then
alter table public.precision_finishing_cuttings
add constraint precision_finishing_cuttings_operator_employee_id_fkey foreign key (operator_employee_id) references public.employees(id);
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'process_standards_job_name_fkey'
) then
alter table public.process_standards
add constraint process_standards_job_name_fkey foreign key (job_name) references public.job_base_settings(job_name) on update cascade on delete
set null;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'process_standards_equipment_no_fkey'
) then
alter table public.process_standards
add constraint process_standards_equipment_no_fkey foreign key (equipment_no) references public.machine_equipment_maintenances(unified_device_no) on update cascade on delete
set null;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'production_order_export_jobs_requested_by_admin_employee_i_fkey'
) then
alter table public.production_order_export_jobs
add constraint production_order_export_jobs_requested_by_admin_employee_i_fkey foreign key (requested_by_admin_employee_id) references public.employees(id);
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'production_daily_report_export_jobs_requested_by_admin_employee_id_fkey'
) then
alter table public.production_daily_report_export_jobs
add constraint production_daily_report_export_jobs_requested_by_admin_employee_id_fkey foreign key (requested_by_admin_employee_id) references public.employees(id);
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'syney_po_items_poid_fkey'
) then
alter table public."syney-po-items"
add constraint syney_po_items_poid_fkey foreign key ("PoId") references public."syney-pos"(id) on delete cascade;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'syney_store_report_items_no_fkey'
) then
alter table public."syney-store-report-items"
add constraint syney_store_report_items_no_fkey foreign key ("No") references public."syney-store-reports"("No") on delete cascade;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'youmai_finished_goods_inventory_product_data_id_fkey'
) then
alter table public.youmai_finished_goods_inventory
add constraint youmai_finished_goods_inventory_product_data_id_fkey foreign key (product_data_id) references public.youmai_product_data(id) on delete cascade;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'youmai_finished_goods_stock_in_product_data_id_fkey'
) then
alter table public.youmai_finished_goods_stock_in
add constraint youmai_finished_goods_stock_in_product_data_id_fkey foreign key (product_data_id) references public.youmai_product_data(id) on delete cascade;
end if;
if not exists (
  select 1
  from pg_constraint
  where conname = 'youmai_finished_goods_stock_out_product_data_id_fkey'
) then
alter table public.youmai_finished_goods_stock_out
add constraint youmai_finished_goods_stock_out_product_data_id_fkey foreign key (product_data_id) references public.youmai_product_data(id) on delete cascade;
end if;
end $$;
insert into public."syney-serial-no" (id, "SyneySerialNo")
values (1, 0) on conflict (id) do nothing;
create or replace function public.get_job_base_setting_options() returns table (job_name text, hourly_fee numeric) language sql stable security definer
set search_path = public as $$
select jbs.job_name,
  jbs.hourly_fee
from public.job_base_settings as jbs
order by jbs.job_name asc $$;
grant execute on function public.get_job_base_setting_options() to authenticated;
create or replace function public.get_job_hourly_fee(target_job_name text) returns numeric language sql stable security definer
set search_path = public as $$
select jbs.hourly_fee
from public.job_base_settings as jbs
where jbs.job_name = target_job_name
limit 1 $$;
grant execute on function public.get_job_hourly_fee(text) to authenticated;
create or replace view public.attendance_details_with_shift as
select ad.id,
  ad.name,
  ad.date,
  ad.time,
  ad.created_at,
  ad.updated_at,
  coalesce(po.shift, '白班') as shift
from public.attendance_details as ad
  left join public.employees as e on e.name = ad.name
  left join public.production_orders as po on po.employee_id = e.id
  and po.order_date = ad.date;
grant select on public.attendance_details_with_shift to authenticated;
create or replace function public.get_attendance_shift_stats(
    p_start_date date default null,
    p_end_date date default null,
    p_name text default null
  ) returns table (
    name text,
    total_days bigint,
    day_shift_days bigint,
    night_shift_days bigint
  ) language sql stable security definer
set search_path = public as $$
select sub.name,
  count(distinct sub.date) as total_days,
  count(
    distinct case
      when sub.shift = '白班' then sub.date
    end
  ) as day_shift_days,
  count(
    distinct case
      when sub.shift = '夜班' then sub.date
    end
  ) as night_shift_days
from (
    select ad.name,
      ad.date,
      coalesce(po.shift, '白班') as shift
    from public.attendance_details as ad
      left join public.employees as e on e.name = ad.name
      left join public.production_orders as po on po.employee_id = e.id
      and po.order_date = ad.date
    where (
        p_start_date is null
        or ad.date >= p_start_date
      )
      and (
        p_end_date is null
        or ad.date <= p_end_date
      )
      and (
        p_name is null
        or p_name = ''
        or ad.name ilike '%' || p_name || '%'
      )
  ) as sub
group by sub.name
order by sub.name asc $$;
grant execute on function public.get_attendance_shift_stats(date, date, text) to authenticated;
create or replace function public.get_attendance_late_early_stats(
    p_start_date date default null,
    p_end_date date default null,
    p_name text default null
  ) returns table (
    name text,
    late_count bigint,
    late_dates text [],
    early_leave_count bigint,
    early_leave_dates text []
  ) language sql stable security definer
set search_path = public as $$ with base as (
    select ad.name,
      ad.date,
      coalesce(po.shift, '白班') as shift,
      po.work_hours::numeric as work_hours,
      min(ad.time::time) as first_punch,
      max(ad.time::time) as last_punch
    from public.attendance_details as ad
      left join public.employees as e on e.name = ad.name
      left join lateral (
        select shift,
          work_hours
        from public.production_orders
        where employee_id = e.id
          and order_date = ad.date
        order by created_at desc
        limit 1
      ) as po on true
    where (
        p_start_date is null
        or ad.date >= p_start_date
      )
      and (
        p_end_date is null
        or ad.date <= p_end_date
      )
      and (
        p_name is null
        or p_name = ''
        or ad.name ilike '%' || p_name || '%'
      )
    group by ad.name,
      ad.date,
      po.shift,
      po.work_hours
  ),
  next_morning as (
    select name,
      date,
      min(time::time) as checkout
    from public.attendance_details
    where time::time < '12:00:00'::time
    group by name,
      date
  ),
  late_records as (
    select name,
      date
    from base
    where (
        shift = '白班'
        and first_punch > '07:05:00'::time
      )
      or (
        shift = '夜班'
        and last_punch > '19:05:00'::time
      )
  ),
  early_leave_records as (
    select b.name,
      b.date
    from base b
    where b.work_hours is not null
      and (
        (
          b.shift = '白班'
          and b.last_punch < '07:00:00'::time + (b.work_hours * interval '1 hour') - interval '5 minutes'
        )
        or (
          b.shift = '夜班'
          and b.work_hours > 5
          and exists (
            select 1
            from next_morning nm
            where nm.name = b.name
              and nm.date = (b.date + interval '1 day')::date
              and extract(
                epoch
                from nm.checkout
              ) < (19 + b.work_hours) * 3600 - 86400 - 300
          )
        )
        or (
          b.shift = '夜班'
          and b.work_hours <= 5
          and b.last_punch < '19:00:00'::time + (b.work_hours * interval '1 hour') - interval '5 minutes'
        )
      )
  ),
  all_names as (
    select distinct name
    from base
  )
select n.name,
  coalesce(l.cnt, 0) as late_count,
  coalesce(l.dates, '{}') as late_dates,
  coalesce(el.cnt, 0) as early_leave_count,
  coalesce(el.dates, '{}') as early_leave_dates
from all_names n
  left join (
    select name,
      count(*) as cnt,
      array_agg(
        date::text
        order by date
      ) as dates
    from late_records
    group by name
  ) l on l.name = n.name
  left join (
    select name,
      count(*) as cnt,
      array_agg(
        date::text
        order by date
      ) as dates
    from early_leave_records
    group by name
  ) el on el.name = n.name
order by n.name $$;
grant execute on function public.get_attendance_late_early_stats(date, date, text) to authenticated;
create or replace view public.v_machine_runtime_items as
select poi.id,
  poi.order_id,
  poi.project_no,
  poi.product_model,
  poi.customer_model,
  poi.length_mm,
  poi.operation,
  poi.incoming_qualified_quantity,
  poi.theoretical_seconds,
  poi.machine_equipment_id,
  poi.incoming_qualified_quantity * poi.theoretical_seconds as runtime_seconds,
  po.order_date,
  po.employee_id,
  e.name as operator_name,
  me.unified_device_no,
  me.operation as device_operation,
  me.machine_name
from public.production_order_items poi
  left join public.production_orders po on poi.order_id = po.id
  left join public.employees e on po.employee_id = e.id
  left join public.machine_equipment_maintenances me on poi.machine_equipment_id = me.id;
grant select on public.v_machine_runtime_items to authenticated;
create or replace function public.increment_serial_no(increment_by integer default 1) returns integer language plpgsql security definer
set search_path = public as $$
declare next_value integer;
begin
insert into public."syney-serial-no" (id, "SyneySerialNo")
values (1, 0) on conflict (id) do nothing;
update public."syney-serial-no"
set "SyneySerialNo" = coalesce("SyneySerialNo", 0) + greatest(coalesce(increment_by, 1), 1)
where id = 1
returning "SyneySerialNo" into next_value;
return next_value;
end;
$$;
grant execute on function public.increment_serial_no(integer) to authenticated;
grant select,
  insert,
  update,
  delete on table public.attendance_details,
  public.job_base_settings,
  public.machine_equipment_maintenances,
  public.material_transfers,
  public.precision_cutting_transfers,
  public.precision_finishing_cuttings,
  public.process_standards,
  public.production_daily_report_export_jobs,
  public.production_order_export_jobs,
  public.production_order_items,
  public.production_orders,
  public.sales_orders,
  public.syney_safe_part_settings,
  public."syney-pos",
  public."syney-po-items",
  public."syney-serial-no",
  public."syney-specs",
  public."syney-store-reports",
  public."syney-store-report-items",
  public.tooling_data,
  public.youmai_product_data,
  public.youmai_finished_goods_inventory,
  public.youmai_finished_goods_stock_in,
  public.youmai_finished_goods_stock_out to authenticated;
grant usage,
  select on all sequences in schema public to authenticated;