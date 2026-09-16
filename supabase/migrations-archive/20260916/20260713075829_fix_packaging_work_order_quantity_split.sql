-- 修复包装工序生产工单多人拆分数量的舍入放大问题：
-- 旧逻辑对每名员工写入 round(总量/人数, 1)，四舍五入误差在列表汇总 sum(quantity) 后被放大，
-- 例如录入总数量 3447、选择 4 名员工时，每人 round(861.75, 1) = 861.8，列表显示 861.8 * 4 = 3447.2。
-- 新逻辑：前 n-1 人取 trunc(总量/人数, 1)（保留 1 位小数、不进位），最后一人吸收余差，
-- 保证所有员工明细之和恒等于录入总量；不良数量采用同一口径。
create or replace function public.save_packaging_work_order_batch(p_input_batch_id uuid, p_values jsonb) returns uuid language plpgsql security invoker
set search_path = public as $$
declare v_input_batch_id uuid;
v_employee_ids uuid [];
v_employee_count integer;
v_index integer;
v_quantity numeric;
v_defective_quantity numeric;
v_quantity_share numeric;
v_defective_quantity_share numeric;
v_row_quantity numeric;
v_row_defective_quantity numeric;
begin if p_values is null
or jsonb_typeof(p_values) <> 'object' then raise exception '生产工单数据不能为空';
end if;
select array_agg(
    employee_id
    order by employee_id
  ) into v_employee_ids
from (
    select distinct nullif(value, '')::uuid as employee_id
    from jsonb_array_elements_text(
        coalesce(p_values->'employee_ids', '[]'::jsonb)
      )
    where nullif(value, '') is not null
  ) as employee_ids;
v_employee_count := coalesce(cardinality(v_employee_ids), 0);
if v_employee_count = 0 then raise exception '请选择至少一名人员';
end if;
v_input_batch_id := coalesce(p_input_batch_id, gen_random_uuid());
if p_input_batch_id is not null then perform 1
from public.packaging_work_orders
where input_batch_id = p_input_batch_id for
update;
if not found then raise exception '生产工单批次不存在';
end if;
end if;
v_quantity := coalesce((p_values->>'quantity')::numeric, 0);
v_defective_quantity := coalesce((p_values->>'defective_quantity')::numeric, 0);
v_quantity_share := trunc(v_quantity / v_employee_count, 1);
v_defective_quantity_share := trunc(v_defective_quantity / v_employee_count, 1);
delete from public.packaging_work_orders
where input_batch_id = v_input_batch_id;
for v_index in 1..v_employee_count loop if v_index < v_employee_count then v_row_quantity := v_quantity_share;
v_row_defective_quantity := v_defective_quantity_share;
else -- 最后一名员工吸收余差，保证明细之和等于录入总量
v_row_quantity := v_quantity - v_quantity_share * (v_employee_count - 1);
v_row_defective_quantity := v_defective_quantity - v_defective_quantity_share * (v_employee_count - 1);
end if;
insert into public.packaging_work_orders (
    input_batch_id,
    work_date,
    employee_id,
    project_no,
    product_model,
    color_name,
    process_name,
    length_mm,
    part_no,
    weight_per_meter_kg,
    unit,
    quantity,
    defective_quantity,
    defect_reason,
    standard_seconds,
    extra_qualified_hours,
    remark
  )
values (
    v_input_batch_id,
    (p_values->>'work_date')::date,
    v_employee_ids [v_index],
    nullif(p_values->>'project_no', ''),
    coalesce(p_values->>'product_model', ''),
    nullif(p_values->>'color_name', ''),
    nullif(p_values->>'process_name', ''),
    nullif(p_values->>'length_mm', '')::numeric,
    nullif(p_values->>'part_no', ''),
    coalesce(
      nullif(p_values->>'weight_per_meter_kg', '')::numeric,
      0
    ),
    coalesce(nullif(p_values->>'unit', ''), '支'),
    v_row_quantity,
    v_row_defective_quantity,
    nullif(p_values->>'defect_reason', ''),
    coalesce(
      nullif(p_values->>'standard_seconds', '')::numeric,
      0
    ),
    coalesce(
      nullif(p_values->>'extra_qualified_hours', '')::numeric,
      0
    ),
    nullif(p_values->>'remark', '')
  );
end loop;
return v_input_batch_id;
end;
$$;
revoke execute on function public.save_packaging_work_order_batch(uuid, jsonb)
from public;
grant execute on function public.save_packaging_work_order_batch(uuid, jsonb) to authenticated;