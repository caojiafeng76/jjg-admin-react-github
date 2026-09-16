-- 包装工序生产工单：数量显示改为"录入多少显示多少"，个人拆分回归四舍五入
--
-- 背景：多人工单保存时把总数量拆到每名员工明细，列表再 sum() 汇总显示，
-- 任何拆分舍入策略都可能让"显示值 ≠ 录入值"（如录入 3447 显示 3447.2）。
-- 新方案：
--   1. 新增 total_quantity / total_defective_quantity 两列，原样保存录入总量，
--      列表批次行直接显示录入总量，不再依赖明细求和。
--   2. 个人明细拆分回归简单四舍五入 round(总量/人数, 1)，仅用于导出明细与工时计算。
--   3. 回填历史数据：多人一致批次的录入总量按整数反推（历史录入均为整数，
--      漂移 |sum-round(sum)| ≤ 0.4 时取整，否则保留原和），明细统一重拆为四舍五入口径。
-- 1) 新增录入总量列
alter table public.packaging_work_orders
add column if not exists total_quantity numeric,
  add column if not exists total_defective_quantity numeric;
comment on column public.packaging_work_orders.total_quantity is '本批次录入的总数量（每行冗余同值），列表显示以此为准';
comment on column public.packaging_work_orders.total_defective_quantity is '本批次录入的总不良数量（每行冗余同值），列表显示以此为准';
-- 2) 回填录入总量
with batch_state as (
  select input_batch_id,
    count(*) as detail_count,
    count(
      distinct row(
        work_date,
        project_no,
        product_model,
        color_name,
        process_name,
        length_mm,
        part_no,
        weight_per_meter_kg,
        unit,
        standard_seconds,
        extra_qualified_hours,
        remark,
        defect_reason
      )
    ) > 1 as is_historical_inconsistent,
    sum(quantity) as quantity_sum,
    sum(defective_quantity) as defective_sum
  from public.packaging_work_orders
  group by input_batch_id
)
update public.packaging_work_orders as work_order
set total_quantity = case
    when bs.is_historical_inconsistent
    or bs.detail_count = 1 then work_order.quantity
    when abs(bs.quantity_sum - round(bs.quantity_sum)) <= 0.4 then round(bs.quantity_sum)
    else bs.quantity_sum
  end,
  total_defective_quantity = case
    when bs.is_historical_inconsistent
    or bs.detail_count = 1 then work_order.defective_quantity
    when abs(bs.defective_sum - round(bs.defective_sum)) <= 0.4 then round(bs.defective_sum)
    else bs.defective_sum
  end
from batch_state as bs
where bs.input_batch_id = work_order.input_batch_id
  and work_order.total_quantity is null;
-- 3) 多人一致批次的明细统一重拆为四舍五入口径
with batch_state as (
  select input_batch_id,
    count(*) as detail_count,
    count(
      distinct row(
        work_date,
        project_no,
        product_model,
        color_name,
        process_name,
        length_mm,
        part_no,
        weight_per_meter_kg,
        unit,
        standard_seconds,
        extra_qualified_hours,
        remark,
        defect_reason
      )
    ) > 1 as is_historical_inconsistent
  from public.packaging_work_orders
  group by input_batch_id
)
update public.packaging_work_orders as work_order
set quantity = round(work_order.total_quantity / bs.detail_count, 1),
  defective_quantity = round(
    coalesce(work_order.total_defective_quantity, 0) / bs.detail_count,
    1
  )
from batch_state as bs
where bs.input_batch_id = work_order.input_batch_id
  and not bs.is_historical_inconsistent
  and bs.detail_count > 1;
-- 4) 保存函数：均分四舍五入 + 写入录入总量
create or replace function public.save_packaging_work_order_batch(p_input_batch_id uuid, p_values jsonb) returns uuid language plpgsql security invoker
set search_path = public as $$
declare v_input_batch_id uuid;
v_employee_ids uuid [];
v_employee_id uuid;
v_employee_count integer;
v_quantity numeric;
v_defective_quantity numeric;
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
delete from public.packaging_work_orders
where input_batch_id = v_input_batch_id;
foreach v_employee_id in array v_employee_ids loop
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
    total_quantity,
    total_defective_quantity,
    defect_reason,
    standard_seconds,
    extra_qualified_hours,
    remark
  )
values (
    v_input_batch_id,
    (p_values->>'work_date')::date,
    v_employee_id,
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
    round(v_quantity / v_employee_count, 1),
    round(v_defective_quantity / v_employee_count, 1),
    v_quantity,
    v_defective_quantity,
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
-- 5) 列表函数：批次数量/不良数量优先显示录入总量
create or replace function public.get_packaging_work_order_batches(
    p_page integer default 1,
    p_page_size integer default 10,
    p_keyword text default null,
    p_start_date date default null,
    p_end_date date default null,
    p_employee_id uuid default null
  ) returns table (
    id uuid,
    input_batch_id uuid,
    employee_ids uuid [],
    employee_names text [],
    work_date date,
    project_no text,
    product_model text,
    color_name text,
    process_name text,
    length_mm numeric,
    part_no text,
    weight_per_meter_kg numeric,
    unit text,
    quantity numeric,
    defective_quantity numeric,
    defective_weight_kg numeric,
    defect_reason text,
    standard_seconds numeric,
    work_hours numeric,
    total_work_hours numeric,
    extra_qualified_hours numeric,
    remark text,
    created_at timestamptz,
    updated_at timestamptz,
    is_historical_inconsistent boolean,
    total_count bigint
  ) language sql security invoker
set search_path = public as $$ with batch_state as (
    select input_batch_id,
      count(
        distinct row(
          work_date,
          project_no,
          product_model,
          color_name,
          process_name,
          length_mm,
          part_no,
          weight_per_meter_kg,
          unit,
          standard_seconds,
          extra_qualified_hours,
          remark,
          defect_reason
        )
      ) > 1 as is_historical_inconsistent
    from public.packaging_work_orders
    group by input_batch_id
  ),
  consistent_batches as (
    select work_order.input_batch_id as id,
      work_order.input_batch_id,
      array_agg(
        work_order.employee_id
        order by employee.name
      ) as employee_ids,
      array_agg(
        employee.name
        order by employee.name
      ) as employee_names,
      max(work_order.work_date) as work_date,
      max(work_order.project_no) as project_no,
      max(work_order.product_model) as product_model,
      max(work_order.color_name) as color_name,
      max(work_order.process_name) as process_name,
      max(work_order.length_mm) as length_mm,
      max(work_order.part_no) as part_no,
      max(work_order.weight_per_meter_kg) as weight_per_meter_kg,
      max(work_order.unit) as unit,
      coalesce(
        max(work_order.total_quantity),
        sum(work_order.quantity)
      ) as quantity,
      coalesce(
        max(work_order.total_defective_quantity),
        sum(work_order.defective_quantity)
      ) as defective_quantity,
      sum(work_order.defective_weight_kg) as defective_weight_kg,
      max(work_order.defect_reason) as defect_reason,
      max(work_order.standard_seconds) as standard_seconds,
      sum(work_order.work_hours) / nullif(count(*), 0) as work_hours,
      sum(work_order.work_hours) as total_work_hours,
      max(work_order.extra_qualified_hours) as extra_qualified_hours,
      max(work_order.remark) as remark,
      min(work_order.created_at) as created_at,
      max(work_order.updated_at) as updated_at,
      false as is_historical_inconsistent
    from public.packaging_work_orders as work_order
      join batch_state on batch_state.input_batch_id = work_order.input_batch_id
      left join public.packaging_employees as employee on employee.id = work_order.employee_id
    where not batch_state.is_historical_inconsistent
    group by work_order.input_batch_id
  ),
  inconsistent_details as (
    select work_order.id,
      work_order.input_batch_id,
      array [work_order.employee_id] as employee_ids,
      array [employee.name] as employee_names,
      work_order.work_date,
      work_order.project_no,
      work_order.product_model,
      work_order.color_name,
      work_order.process_name,
      work_order.length_mm,
      work_order.part_no,
      work_order.weight_per_meter_kg,
      work_order.unit,
      work_order.quantity,
      work_order.defective_quantity,
      work_order.defective_weight_kg,
      work_order.defect_reason,
      work_order.standard_seconds,
      work_order.work_hours,
      work_order.work_hours as total_work_hours,
      work_order.extra_qualified_hours,
      work_order.remark,
      work_order.created_at,
      work_order.updated_at,
      true as is_historical_inconsistent
    from public.packaging_work_orders as work_order
      join batch_state on batch_state.input_batch_id = work_order.input_batch_id
      left join public.packaging_employees as employee on employee.id = work_order.employee_id
    where batch_state.is_historical_inconsistent
  ),
  all_rows as (
    select *
    from consistent_batches
    union all
    select *
    from inconsistent_details
  ),
  filtered_rows as (
    select *
    from all_rows
    where (
        p_keyword is null
        or btrim(p_keyword) = ''
        or product_model ilike '%' || btrim(p_keyword) || '%'
        or coalesce(project_no, '') ilike '%' || btrim(p_keyword) || '%'
        or coalesce(part_no, '') ilike '%' || btrim(p_keyword) || '%'
        or coalesce(array_to_string(employee_names, ' '), '') ilike '%' || btrim(p_keyword) || '%'
      )
      and (
        p_start_date is null
        or work_date >= p_start_date
      )
      and (
        p_end_date is null
        or work_date <= p_end_date
      )
      and (
        p_employee_id is null
        or p_employee_id = any(employee_ids)
      )
  ),
  numbered_rows as (
    select filtered_rows.*,
      count(*) over () as total_count
    from filtered_rows
  )
select *
from numbered_rows
order by work_date desc,
  created_at desc offset greatest(p_page - 1, 0) * greatest(p_page_size, 1)
limit greatest(p_page_size, 1);
$$;
revoke execute on function public.get_packaging_work_order_batches(integer, integer, text, date, date, uuid)
from public;
grant execute on function public.get_packaging_work_order_batches(integer, integer, text, date, date, uuid) to authenticated;