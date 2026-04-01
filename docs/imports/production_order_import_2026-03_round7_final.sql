with employee_seed as (
  select *
  from json_to_recordset($employee_json$[{"name":"尚红梅"},{"name":"杨艺博"}]$employee_json$) as x(name text)
), inserted_employees as (
  insert into public.employees (name)
  select e.name
  from employee_seed e
  where not exists (
    select 1 from public.employees existing where existing.name = e.name
  )
  returning id, name
), process_seed as (
  select *
  from json_to_recordset($process_json$[{"model":"113-80","operation":"刮毛刺","standard_seconds":48,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"113-80","operation":"检验","standard_seconds":40,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"113-80","operation":"去毛刺","standard_seconds":30,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"213-553","operation":"切割45°","standard_seconds":30,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"213-553","operation":"CNC","standard_seconds":60,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"243-273","operation":"打孔5个","standard_seconds":100,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"243-273","operation":"攻丝5个","standard_seconds":95,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"286-398","operation":"CNC","standard_seconds":70,"remark":"2026-03 历史工单补录 round7 自动补齐"},{"model":"灯罩","operation":"包装","standard_seconds":0,"remark":"2026-03 历史工单补录 round7 自动补齐"}]$process_json$) as x(model text, operation text, standard_seconds numeric, remark text)
), inserted_process as (
  insert into public.process_standards (model, operation, standard_seconds, remark)
  select p.model, p.operation, p.standard_seconds, p.remark
  from process_seed p
  where not exists (
    select 1
    from public.process_standards existing
    where existing.model = p.model and existing.operation = p.operation
  )
  returning model, operation
), order_seed as (
  select *
  from json_to_recordset($order_json$[{"employee_name":"曹林","order_date":"2026-03-16","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"曹林","order_date":"2026-03-17","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"曹林","order_date":"2026-03-18","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"曹林","order_date":"2026-03-19","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"曾庆伟","order_date":"2026-03-11","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"陈文香","order_date":"2026-03-05","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"冯永惠","order_date":"2026-03-03","work_hours":12,"extra_qualified_hours":0,"remark":null},{"employee_name":"陆康","order_date":"2026-03-05","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"陆康","order_date":"2026-03-14","work_hours":12,"extra_qualified_hours":12.222222,"remark":null},{"employee_name":"尚红梅","order_date":"2026-03-10","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"尚红梅","order_date":"2026-03-11","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"尚红梅","order_date":"2026-03-12","work_hours":11,"extra_qualified_hours":3,"remark":null},{"employee_name":"尚伦英","order_date":"2026-03-04","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"尚伦英","order_date":"2026-03-05","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"尚伦英","order_date":"2026-03-07","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"尚伦英","order_date":"2026-03-10","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"尚能群","order_date":"2026-03-18","work_hours":4,"extra_qualified_hours":4,"remark":"整形"},{"employee_name":"沈龙杰","order_date":"2026-03-08","work_hours":9.5,"extra_qualified_hours":1.5,"remark":null},{"employee_name":"沈龙杰","order_date":"2026-03-09","work_hours":9.5,"extra_qualified_hours":9,"remark":null},{"employee_name":"宋小春","order_date":"2026-03-06","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"宋小春","order_date":"2026-03-08","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"宋小春","order_date":"2026-03-09","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"宋小春","order_date":"2026-03-10","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"宋小冬","order_date":"2026-03-05","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"谭术林","order_date":"2026-03-03","work_hours":12,"extra_qualified_hours":0,"remark":null},{"employee_name":"吴鹏飞","order_date":"2026-03-03","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"吴鹏飞","order_date":"2026-03-09","work_hours":11,"extra_qualified_hours":6,"remark":null},{"employee_name":"徐新妹","order_date":"2026-03-14","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"杨艺博","order_date":"2026-03-01","work_hours":9.5,"extra_qualified_hours":0,"remark":null},{"employee_name":"杨艺博","order_date":"2026-03-02","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"杨艺博","order_date":"2026-03-03","work_hours":11,"extra_qualified_hours":0,"remark":null},{"employee_name":"杨艺博","order_date":"2026-03-04","work_hours":9.5,"extra_qualified_hours":9.5,"remark":null},{"employee_name":"杨艺博","order_date":"2026-03-05","work_hours":11,"extra_qualified_hours":11,"remark":null},{"employee_name":"杨艺博","order_date":"2026-03-06","work_hours":9.5,"extra_qualified_hours":9,"remark":null},{"employee_name":"张吉成","order_date":"2026-03-14","work_hours":11,"extra_qualified_hours":0,"remark":null}]$order_json$) as x(
    employee_name text,
    order_date date,
    work_hours numeric,
    extra_qualified_hours numeric,
    remark text
  )
), item_seed as (
  select *
  from json_to_recordset($item_json$[{"employee_name":"陈文香","order_date":"2026-03-05","project_no":"","product_model":"113-54","length_mm":138.8,"operation":"CNC","standard_seconds":160,"incoming_qualified_quantity":252,"qualified_quantity":252,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"冯永惠","order_date":"2026-03-03","project_no":"","product_model":"286-337","length_mm":null,"operation":"打孔","standard_seconds":100,"incoming_qualified_quantity":28,"qualified_quantity":28,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"冯永惠","order_date":"2026-03-03","project_no":"26022708-05","product_model":"180-259","length_mm":950,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":515,"qualified_quantity":515,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"冯永惠","order_date":"2026-03-03","project_no":"26022708-08","product_model":"180-259","length_mm":1150,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":15,"qualified_quantity":15,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"冯永惠","order_date":"2026-03-03","project_no":"26022708-06","product_model":"180-259","length_mm":1150,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":575,"qualified_quantity":575,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"陆康","order_date":"2026-03-05","project_no":"","product_model":"113-54","length_mm":138.8,"operation":"抛光","standard_seconds":160,"incoming_qualified_quantity":252,"qualified_quantity":252,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"尚红梅","order_date":"2026-03-10","project_no":"26022602-04","product_model":"03-25","length_mm":387,"operation":"冲孔2","standard_seconds":15,"incoming_qualified_quantity":1253,"qualified_quantity":1245,"defect_quantity_1":8,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"尚红梅","order_date":"2026-03-11","project_no":"26022602-04","product_model":"03-25","length_mm":387,"operation":"冲孔2","standard_seconds":15,"incoming_qualified_quantity":101,"qualified_quantity":101,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"尚红梅","order_date":"2026-03-11","project_no":"26022703-02","product_model":"262-1791","length_mm":1990,"operation":"冲孔2","standard_seconds":25,"incoming_qualified_quantity":236,"qualified_quantity":234,"defect_quantity_1":2,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"尚红梅","order_date":"2026-03-12","project_no":"26022703-02","product_model":"262-1791","length_mm":1990,"operation":"冲孔2","standard_seconds":25,"incoming_qualified_quantity":298,"qualified_quantity":294,"defect_quantity_1":4,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"沈龙杰","order_date":"2026-03-08","project_no":"26022504-05","product_model":"213-554","length_mm":51.1,"operation":"自动切割","standard_seconds":12,"incoming_qualified_quantity":1412,"qualified_quantity":1412,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"宋小冬","order_date":"2026-03-05","project_no":"","product_model":"113-54","length_mm":138.8,"operation":"抛光","standard_seconds":160,"incoming_qualified_quantity":252,"qualified_quantity":252,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"谭术林","order_date":"2026-03-03","project_no":"","product_model":"286-337","length_mm":null,"operation":"打孔","standard_seconds":100,"incoming_qualified_quantity":28,"qualified_quantity":28,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"谭术林","order_date":"2026-03-03","project_no":"26022708-05","product_model":"180-259","length_mm":950,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":515,"qualified_quantity":515,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"谭术林","order_date":"2026-03-03","project_no":"26022708-08","product_model":"180-259","length_mm":1150,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":15,"qualified_quantity":15,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"谭术林","order_date":"2026-03-03","project_no":"26022708-06","product_model":"180-259","length_mm":1150,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":575,"qualified_quantity":575,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"吴鹏飞","order_date":"2026-03-03","project_no":"26022711-07","product_model":"180-259","length_mm":950,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":553,"qualified_quantity":553,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"吴鹏飞","order_date":"2026-03-03","project_no":"","product_model":"286-337","length_mm":null,"operation":"端铣","standard_seconds":120,"incoming_qualified_quantity":42,"qualified_quantity":42,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"吴鹏飞","order_date":"2026-03-09","project_no":"26022504-04","product_model":"213-553","length_mm":1960,"operation":"切割45°","standard_seconds":30,"incoming_qualified_quantity":264,"qualified_quantity":264,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"吴鹏飞","order_date":"2026-03-09","project_no":"西尼","product_model":"243-273","length_mm":860,"operation":"打孔5个","standard_seconds":100,"incoming_qualified_quantity":53,"qualified_quantity":53,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":"挑料4H"},{"employee_name":"吴鹏飞","order_date":"2026-03-09","project_no":"西尼","product_model":"243-273","length_mm":860,"operation":"攻丝5个","standard_seconds":95,"incoming_qualified_quantity":86,"qualified_quantity":86,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"吴鹏飞","order_date":"2026-03-09","project_no":"","product_model":"灯罩","length_mm":null,"operation":"包装","standard_seconds":0,"incoming_qualified_quantity":16,"qualified_quantity":16,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"徐新妹","order_date":"2026-03-14","project_no":"25090907-01","product_model":"113-80","length_mm":1942,"operation":"去毛刺","standard_seconds":30,"incoming_qualified_quantity":744,"qualified_quantity":744,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"徐新妹","order_date":"2026-03-14","project_no":"25090907-02","product_model":"113-80","length_mm":1942,"operation":"去毛刺","standard_seconds":30,"incoming_qualified_quantity":159,"qualified_quantity":159,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"徐新妹","order_date":"2026-03-14","project_no":"26022504-03","product_model":"213-553","length_mm":1960,"operation":"CNC","standard_seconds":60,"incoming_qualified_quantity":73,"qualified_quantity":73,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"徐新妹","order_date":"2026-03-14","project_no":"26022504-04","product_model":"213-553","length_mm":1960,"operation":"CNC","standard_seconds":60,"incoming_qualified_quantity":106,"qualified_quantity":106,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"徐新妹","order_date":"2026-03-14","project_no":"25070202-10","product_model":"286-398","length_mm":130,"operation":"CNC","standard_seconds":70,"incoming_qualified_quantity":102,"qualified_quantity":102,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"杨艺博","order_date":"2026-03-01","project_no":"25090907-02","product_model":"113-80","length_mm":1942,"operation":"刮毛刺","standard_seconds":48,"incoming_qualified_quantity":1157,"qualified_quantity":1157,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"杨艺博","order_date":"2026-03-02","project_no":"25090907-01","product_model":"113-80","length_mm":1942,"operation":"检验","standard_seconds":40,"incoming_qualified_quantity":507,"qualified_quantity":507,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"杨艺博","order_date":"2026-03-02","project_no":"25090907-02","product_model":"113-80","length_mm":1942,"operation":"检验","standard_seconds":40,"incoming_qualified_quantity":628,"qualified_quantity":628,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"杨艺博","order_date":"2026-03-03","project_no":"26022711-07","product_model":"180-259","length_mm":950,"operation":"端铣","standard_seconds":20,"incoming_qualified_quantity":553,"qualified_quantity":553,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"杨艺博","order_date":"2026-03-03","project_no":"","product_model":"286-337","length_mm":null,"operation":"端铣","standard_seconds":120,"incoming_qualified_quantity":42,"qualified_quantity":42,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"张吉成","order_date":"2026-03-14","project_no":"25090907-01","product_model":"113-80","length_mm":1942,"operation":"去毛刺","standard_seconds":30,"incoming_qualified_quantity":744,"qualified_quantity":744,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"张吉成","order_date":"2026-03-14","project_no":"25090907-02","product_model":"113-80","length_mm":1942,"operation":"去毛刺","standard_seconds":30,"incoming_qualified_quantity":318,"qualified_quantity":318,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_name":"张吉成","order_date":"2026-03-14","project_no":"26020502-03","product_model":"105-331","length_mm":119.5,"operation":"沉孔","standard_seconds":12,"incoming_qualified_quantity":650,"qualified_quantity":650,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null}]$item_json$) as x(
    employee_name text,
    order_date date,
    project_no text,
    product_model text,
    length_mm numeric,
    operation text,
    standard_seconds numeric,
    incoming_qualified_quantity integer,
    qualified_quantity integer,
    defect_quantity_1 integer,
    defect_reason_1 text,
    defect_quantity_2 integer,
    defect_reason_2 text,
    data_category text,
    remark text
  )
), order_employee_names as (
  select employee_name as name from order_seed
  union
  select employee_name as name from item_seed
), employee_map as (
  select id, name from inserted_employees
  union
  select existing.id, existing.name
  from public.employees existing
  join order_employee_names names on names.name = existing.name
), inserted_orders as (
  insert into public.production_orders (
    id, order_date, employee_id, work_hours, shift, extra_qualified_hours, remark
  )
  select
    gen_random_uuid(),
    o.order_date,
    e.id,
    o.work_hours,
    '白班',
    o.extra_qualified_hours,
    o.remark
  from order_seed o
  join employee_map e on e.name = o.employee_name
  where not exists (
    select 1 from public.production_orders po
    where po.employee_id = e.id and po.order_date = o.order_date
  )
  returning id, employee_id, order_date
), target_orders as (
  select id, employee_id, order_date from inserted_orders
  union
  select po.id, po.employee_id, po.order_date
  from public.production_orders po
  join order_seed o on po.order_date = o.order_date
  join employee_map e on e.id = po.employee_id and e.name = o.employee_name
), prepared_items as (
  select
    o.id as order_id,
    i.project_no,
    i.product_model,
    case when so.product_model = i.product_model then coalesce(so.length_mm, i.length_mm) else i.length_mm end as length_mm,
    case when so.product_model = i.product_model then so.customer_model else null end as customer_model,
    i.operation,
    i.standard_seconds,
    i.incoming_qualified_quantity,
    i.qualified_quantity,
    i.defect_quantity_1,
    i.defect_reason_1,
    i.defect_quantity_2,
    i.defect_reason_2,
    i.data_category,
    i.remark
  from item_seed i
  join employee_map e on e.name = i.employee_name
  join target_orders o on o.employee_id = e.id and o.order_date = i.order_date
  left join public.sales_orders so on so.project_no = i.project_no
), inserted_items as (
  insert into public.production_order_items (
    order_id, project_no, product_model, length_mm, customer_model, operation,
    standard_seconds, incoming_qualified_quantity, qualified_quantity,
    defect_quantity_1, defect_reason_1, defect_quantity_2, defect_reason_2,
    data_category, remark
  )
  select
    p.order_id,
    p.project_no,
    p.product_model,
    p.length_mm,
    p.customer_model,
    p.operation,
    p.standard_seconds,
    p.incoming_qualified_quantity,
    p.qualified_quantity,
    p.defect_quantity_1,
    p.defect_reason_1,
    p.defect_quantity_2,
    p.defect_reason_2,
    p.data_category,
    p.remark
  from prepared_items p
  where not exists (
    select 1 from public.production_order_items poi
    where poi.order_id = p.order_id
      and coalesce(poi.project_no, '') = coalesce(p.project_no, '')
      and poi.product_model = p.product_model
      and coalesce(poi.length_mm, -1) = coalesce(p.length_mm, -1)
      and coalesce(poi.customer_model, '') = coalesce(p.customer_model, '')
      and poi.operation = p.operation
      and poi.qualified_quantity = p.qualified_quantity
      and coalesce(poi.defect_quantity_1, 0) = coalesce(p.defect_quantity_1, 0)
  )
  returning id
)
select
  2::integer as expected_employees,
  9::integer as expected_process_standards,
  35::integer as expected_orders,
  35::integer as expected_items,
  (select count(*) from inserted_employees) as inserted_employees,
  (select count(*) from inserted_process) as inserted_process_standards,
  (select count(*) from inserted_orders) as inserted_orders,
  (select count(*) from inserted_items) as inserted_items;
