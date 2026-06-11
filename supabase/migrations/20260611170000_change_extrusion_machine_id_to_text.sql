-- 将 extrusion_productions.machine_id 从引用 machine_equipment_maintenances.id (uuid)
-- 改为引用 machine_equipment_maintenances.unified_device_no (text)
--
-- 策略：外键列改为 text 类型，前端通过设备编号（unified_device_no）而非 UUID 进行关联。
-- 优点：设备编号是业务可读值，前端/后端均更直观。
-- 注意：unified_device_no 已在 create_migration 中设唯一约束，无需重复创建。

-- 2. 删除原有的 uuid 外键约束
alter table public.extrusion_productions
  drop constraint if exists extrusion_productions_machine_id_fkey;

-- 3. 将 machine_id 列从 uuid 改为 text（先删除默认值和约束，再改类型）
alter table public.extrusion_productions
  alter column machine_id drop default;

alter table public.extrusion_productions
  alter column machine_id type text using machine_id::text;

-- 4. 添加新的 text 外键约束，引用 unified_device_no
alter table public.extrusion_productions
  add constraint extrusion_productions_machine_id_fkey
  foreign key (machine_id)
  references public.machine_equipment_maintenances (unified_device_no)
  on update cascade
  on delete restrict;

-- 5. 更新索引名（保持命名一致）
drop index if exists public.idx_extrusion_productions_machine_id;
create index if not exists idx_extrusion_productions_machine_id
  on public.extrusion_productions (machine_id);

-- 6. 更新 upsert_extrusion_production 函数，machine_id 改为 text 不再 cast uuid
--    注意：shift_leader_name / operator_name / inspector_name 已在 rename_migration 中改为 text
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

  -- machine_id 现在是 text，直接取用，不再 cast uuid
  -- id 仍为 uuid，需 cast
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
      machine_id = p_header ->> 'machine_id',
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
      p_header ->> 'machine_id',
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
