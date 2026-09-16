-- 重命名 operator_name 和 inspector_name 列为 legacy_ 前缀，保留历史数据
-- 挤压生产单表单不再使用这两个字段（改为固定班组长下拉）

alter table public.extrusion_productions
  rename column operator_name to legacy_operator_name;

alter table public.extrusion_productions
  rename column inspector_name to legacy_inspector_name;

comment on column public.extrusion_productions.legacy_operator_name is '操作人(已废弃，请使用 legacy_ 前缀)';
comment on column public.extrusion_productions.legacy_inspector_name is '检验人(已废弃，请使用 legacy_ 前缀)';

-- 更新 upsert_extrusion_production 函数，移除 operator_name 和 inspector_name 写入

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
