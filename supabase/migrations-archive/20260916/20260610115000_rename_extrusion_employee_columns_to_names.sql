alter table public.extrusion_productions
  rename column shift_leader_employee_id to shift_leader_name;

alter table public.extrusion_productions
  rename column operator_employee_id to operator_name;

alter table public.extrusion_productions
  rename column inspector_employee_id to inspector_name;

alter table public.extrusion_productions
  drop constraint if exists extrusion_productions_shift_leader_employee_id_fkey,
  drop constraint if exists extrusion_productions_operator_employee_id_fkey,
  drop constraint if exists extrusion_productions_inspector_employee_id_fkey;

alter table public.extrusion_productions
  alter column shift_leader_name type text using shift_leader_name::text,
  alter column operator_name type text using operator_name::text,
  alter column inspector_name type text using inspector_name::text;

update public.extrusion_productions
set
  shift_leader_name = (
    select name from public.employees where id::text = extrusion_productions.shift_leader_name
  ),
  operator_name = (
    select name from public.employees where id::text = extrusion_productions.operator_name
  ),
  inspector_name = (
    select name from public.employees where id::text = extrusion_productions.inspector_name
  );

comment on column public.extrusion_productions.shift_leader_name is '班组长姓名';
comment on column public.extrusion_productions.operator_name is '操作人姓名';
comment on column public.extrusion_productions.inspector_name is '检验人姓名';

create index if not exists idx_extrusion_productions_operator_name
  on public.extrusion_productions (operator_name);

drop index if exists public.idx_extrusion_productions_operator_employee_id;

create or replace function public.upsert_extrusion_production(
  p_header jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_extrusion_production_id uuid;
  v_existing_id uuid;
  v_item jsonb;
begin
  if p_header is null or jsonb_typeof(p_header) <> 'object' then
    raise exception '挤压生产单表头不能为空';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '挤压生产单明细不能为空';
  end if;

  v_extrusion_production_id := nullif(p_header ->> 'id', '')::uuid;

  if v_extrusion_production_id is not null then
    select ep.id
      into v_existing_id
    from public.extrusion_productions ep
    where ep.id = v_extrusion_production_id
    for update;

    if v_existing_id is null then
      raise exception '挤压生产单不存在';
    end if;

    update public.extrusion_productions
    set
      production_date = (p_header ->> 'production_date')::date,
      machine_id = (p_header ->> 'machine_id')::uuid,
      shift = p_header ->> 'shift',
      shift_leader_name = nullif(p_header ->> 'shift_leader_name', ''),
      operator_name = nullif(p_header ->> 'operator_name', ''),
      inspector_name = nullif(p_header ->> 'inspector_name', ''),
      uploaded_by_name = nullif(p_header ->> 'uploaded_by_name', ''),
      remark = nullif(p_header ->> 'remark', ''),
      is_audited = coalesce((p_header ->> 'is_audited')::boolean, false),
      audited_at = nullif(p_header ->> 'audited_at', '')::timestamptz
    where id = v_extrusion_production_id;

    delete from public.extrusion_production_items
    where extrusion_production_id = v_extrusion_production_id;
  else
    insert into public.extrusion_productions (
      production_date,
      machine_id,
      shift,
      shift_leader_name,
      operator_name,
      inspector_name,
      uploaded_by_name,
      remark,
      is_audited,
      audited_at
    )
    values (
      (p_header ->> 'production_date')::date,
      (p_header ->> 'machine_id')::uuid,
      p_header ->> 'shift',
      nullif(p_header ->> 'shift_leader_name', ''),
      nullif(p_header ->> 'operator_name', ''),
      nullif(p_header ->> 'inspector_name', ''),
      nullif(p_header ->> 'uploaded_by_name', ''),
      nullif(p_header ->> 'remark', ''),
      coalesce((p_header ->> 'is_audited')::boolean, false),
      nullif(p_header ->> 'audited_at', '')::timestamptz
    )
    returning id into v_extrusion_production_id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.extrusion_production_items (
      extrusion_production_id,
      sort_order,
      project_no,
      product_model,
      customer,
      customer_model,
      material_name,
      order_length_mm,
      theoretical_unit_weight_kg_per_meter,
      die_no,
      billet_diameter_mm,
      billet_length_mm,
      billet_quantity,
      billet_input_weight_kg,
      actual_output_length_mm,
      actual_unit_weight_kg,
      actual_quantity,
      theoretical_output_count,
      theoretical_output_weight_kg,
      actual_output_weight_kg,
      scrap_weight_kg,
      tailing_weight_kg,
      material_yield,
      remark
    )
    values (
      v_extrusion_production_id,
      coalesce((v_item ->> 'sort_order')::integer, 0),
      v_item ->> 'project_no',
      nullif(v_item ->> 'product_model', ''),
      nullif(v_item ->> 'customer', ''),
      nullif(v_item ->> 'customer_model', ''),
      nullif(v_item ->> 'material_name', ''),
      (v_item ->> 'order_length_mm')::numeric,
      (v_item ->> 'theoretical_unit_weight_kg_per_meter')::numeric,
      nullif(v_item ->> 'die_no', ''),
      (v_item ->> 'billet_diameter_mm')::numeric,
      (v_item ->> 'billet_length_mm')::numeric,
      (v_item ->> 'billet_quantity')::integer,
      (v_item ->> 'billet_input_weight_kg')::numeric,
      (v_item ->> 'actual_output_length_mm')::numeric,
      (v_item ->> 'actual_unit_weight_kg')::numeric,
      coalesce((v_item ->> 'actual_quantity')::integer, 0),
      coalesce((v_item ->> 'theoretical_output_count')::integer, 0),
      coalesce((v_item ->> 'theoretical_output_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'actual_output_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'scrap_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'tailing_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'material_yield')::numeric, 0),
      nullif(v_item ->> 'remark', '')
    );
  end loop;

  return v_extrusion_production_id;
end;
$$;
