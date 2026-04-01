with process_seed as (
  select *
  from json_to_recordset($process_json$[{"model":"213-553","operation":"CNC","standard_seconds":60,"remark":"2026-03 历史不良直录自动补齐"},{"model":"180-259","operation":"CNC","standard_seconds":110,"remark":"2026-03 历史不良直录自动补齐"},{"model":"03-03","operation":"CNC2","standard_seconds":160,"remark":"2026-03 历史不良直录自动补齐"},{"model":"213-261","operation":"冲孔2","standard_seconds":25,"remark":"2026-03 历史不良直录自动补齐"},{"model":"82-440","operation":"自动切","standard_seconds":25,"remark":"2026-03 历史不良直录自动补齐"},{"model":"180-217","operation":"CNC","standard_seconds":400,"remark":"2026-03 历史不良直录自动补齐"},{"model":"03-03","operation":"CNC1","standard_seconds":75,"remark":"2026-03 历史不良直录自动补齐"},{"model":"03-02","operation":"CNC1","standard_seconds":90,"remark":"2026-03 历史不良直录自动补齐"},{"model":"269-390","operation":"CNC1","standard_seconds":270,"remark":"2026-03 历史不良直录自动补齐"},{"model":"269-390","operation":"CNC2","standard_seconds":160,"remark":"2026-03 历史不良直录自动补齐"}]$process_json$)
    as x(model text, operation text, standard_seconds numeric, remark text)
), upsert_process as (
  insert into public.process_standards (model, operation, standard_seconds, remark)
  select model, operation, standard_seconds, remark
  from process_seed
  on conflict (model, operation) do update
  set standard_seconds = excluded.standard_seconds,
      remark = excluded.remark
  returning model, operation
), order_seed as (
  select *
  from json_to_recordset($order_json$[{"employee_id":"78d7232c-abec-48fd-99ab-bf55eb8fe68b","order_date":"2026-03-13","work_hours":12},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-13","work_hours":12},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-19","work_hours":11},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-06","work_hours":12},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-10","work_hours":11},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-20","work_hours":12},{"employee_id":"262b4e7f-d0f2-47eb-a41e-dc3e12c5bdfe","order_date":"2026-03-11","work_hours":11},{"employee_id":"352756ee-cfe5-4286-b258-e514a578f683","order_date":"2026-03-05","work_hours":9.5},{"employee_id":"8d3d4ecd-eb29-4af2-83be-2d76618cac50","order_date":"2026-03-07","work_hours":11},{"employee_id":"8d3d4ecd-eb29-4af2-83be-2d76618cac50","order_date":"2026-03-19","work_hours":11},{"employee_id":"b3249c63-79cb-4aad-9403-f971e89c215d","order_date":"2026-03-16","work_hours":12},{"employee_id":"17842c7d-961b-427f-9120-3b4aef5159a7","order_date":"2026-03-19","work_hours":11},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-06","work_hours":11},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-12","work_hours":11}]$order_json$)
    as x(employee_id uuid, order_date date, work_hours numeric)
), inserted_orders as (
  insert into public.production_orders (
    id, order_date, employee_id, work_hours, shift, extra_qualified_hours, remark
  )
  select
    gen_random_uuid(),
    s.order_date,
    s.employee_id,
    s.work_hours,
    '白班',
    0,
    null
  from order_seed s
  where not exists (
    select 1 from public.production_orders po
    where po.employee_id = s.employee_id and po.order_date = s.order_date
  )
  returning id, employee_id, order_date
), target_orders as (
  select id, employee_id, order_date from inserted_orders
  union all
  select po.id, po.employee_id, po.order_date
  from public.production_orders po
  join order_seed s on po.employee_id = s.employee_id and po.order_date = s.order_date
), item_seed as (
  select *
  from json_to_recordset($item_json$[{"employee_id":"78d7232c-abec-48fd-99ab-bf55eb8fe68b","order_date":"2026-03-13","project_no":"26020502-02","product_model":"105-331","length_mm":119.5,"operation":"沉孔","standard_seconds":12,"incoming_qualified_quantity":534,"qualified_quantity":534,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"78d7232c-abec-48fd-99ab-bf55eb8fe68b","order_date":"2026-03-13","project_no":"25090907-02","product_model":"113-80","length_mm":1942,"operation":"冲头孔","standard_seconds":25,"incoming_qualified_quantity":226,"qualified_quantity":226,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"78d7232c-abec-48fd-99ab-bf55eb8fe68b","order_date":"2026-03-13","project_no":"25090907-02","product_model":"113-80","length_mm":1942,"operation":"沉孔","standard_seconds":35,"incoming_qualified_quantity":23,"qualified_quantity":4,"defect_quantity_1":19,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"78d7232c-abec-48fd-99ab-bf55eb8fe68b","order_date":"2026-03-13","project_no":"26020502-03","product_model":"105-331","length_mm":119.5,"operation":"倒角","standard_seconds":15,"incoming_qualified_quantity":1600,"qualified_quantity":1600,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-13","project_no":"25090907-01","product_model":"113-80","length_mm":1942,"operation":"CNC","standard_seconds":65,"incoming_qualified_quantity":374,"qualified_quantity":346,"defect_quantity_1":28,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-13","project_no":"25090907-02","product_model":"113-80","length_mm":1942,"operation":"CNC","standard_seconds":65,"incoming_qualified_quantity":234,"qualified_quantity":226,"defect_quantity_1":8,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-13","project_no":"26022504-04","product_model":"213-553","length_mm":1960,"operation":"CNC","standard_seconds":60,"incoming_qualified_quantity":16,"qualified_quantity":16,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-13","project_no":"26022504-03","product_model":"213-553","length_mm":1960,"operation":"CNC","standard_seconds":60,"incoming_qualified_quantity":181,"qualified_quantity":181,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-19","project_no":"","product_model":"180-259","length_mm":1500,"operation":"CNC","standard_seconds":110,"incoming_qualified_quantity":68,"qualified_quantity":68,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"10db1c15-c154-4ec3-af53-8e06caa6d6f7","order_date":"2026-03-19","project_no":"25062804-02","product_model":"113-54","length_mm":138.8,"operation":"CNC","standard_seconds":160,"incoming_qualified_quantity":250,"qualified_quantity":240,"defect_quantity_1":10,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-06","project_no":"","product_model":"113-54","length_mm":138.8,"operation":"CNC","standard_seconds":160,"incoming_qualified_quantity":210,"qualified_quantity":210,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-06","project_no":"","product_model":"03-02","length_mm":171.5,"operation":"CNC2","standard_seconds":180,"incoming_qualified_quantity":41,"qualified_quantity":41,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-06","project_no":"","product_model":"03-03","length_mm":171.5,"operation":"CNC2","standard_seconds":160,"incoming_qualified_quantity":43,"qualified_quantity":39,"defect_quantity_1":4,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-10","project_no":"","product_model":"113-54","length_mm":138.8,"operation":"CNC","standard_seconds":160,"incoming_qualified_quantity":110,"qualified_quantity":110,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-10","project_no":"26022504-04","product_model":"213-553","length_mm":1960,"operation":"CNC","standard_seconds":60,"incoming_qualified_quantity":465,"qualified_quantity":455,"defect_quantity_1":10,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-20","project_no":"26031301-03","product_model":"213-553","length_mm":1960,"operation":"CNC","standard_seconds":60,"incoming_qualified_quantity":416,"qualified_quantity":410,"defect_quantity_1":6,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"d97221c0-620e-4183-a9ea-3ca91bb06573","order_date":"2026-03-20","project_no":"26031301-04","product_model":"213-553","length_mm":1960,"operation":"CNC","standard_seconds":60,"incoming_qualified_quantity":297,"qualified_quantity":297,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"262b4e7f-d0f2-47eb-a41e-dc3e12c5bdfe","order_date":"2026-03-11","project_no":"25121005-09","product_model":"213-261","length_mm":658.6,"operation":"冲孔2","standard_seconds":25,"incoming_qualified_quantity":798,"qualified_quantity":768,"defect_quantity_1":30,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"262b4e7f-d0f2-47eb-a41e-dc3e12c5bdfe","order_date":"2026-03-11","project_no":"25121004-05","product_model":"213-261","length_mm":658.6,"operation":"冲孔2","standard_seconds":25,"incoming_qualified_quantity":97,"qualified_quantity":97,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"262b4e7f-d0f2-47eb-a41e-dc3e12c5bdfe","order_date":"2026-03-11","project_no":"26022504-04","product_model":"213-553","length_mm":1960,"operation":"冲牙齿","standard_seconds":25,"incoming_qualified_quantity":67,"qualified_quantity":65,"defect_quantity_1":2,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"262b4e7f-d0f2-47eb-a41e-dc3e12c5bdfe","order_date":"2026-03-11","project_no":"26022504-03","product_model":"213-553","length_mm":1960,"operation":"冲牙齿","standard_seconds":25,"incoming_qualified_quantity":277,"qualified_quantity":277,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"262b4e7f-d0f2-47eb-a41e-dc3e12c5bdfe","order_date":"2026-03-11","project_no":"26022504-02","product_model":"213-553","length_mm":780,"operation":"冲牙齿","standard_seconds":25,"incoming_qualified_quantity":664,"qualified_quantity":664,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"352756ee-cfe5-4286-b258-e514a578f683","order_date":"2026-03-05","project_no":"26022504-05","product_model":"213-554","length_mm":51.1,"operation":"自动切割","standard_seconds":12,"incoming_qualified_quantity":1769,"qualified_quantity":1769,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"352756ee-cfe5-4286-b258-e514a578f683","order_date":"2026-03-05","project_no":"","product_model":"82-440","length_mm":270,"operation":"自动切","standard_seconds":25,"incoming_qualified_quantity":683,"qualified_quantity":683,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"8d3d4ecd-eb29-4af2-83be-2d76618cac50","order_date":"2026-03-07","project_no":"26020701-01","product_model":"180-217","length_mm":1633.7,"operation":"CNC","standard_seconds":400,"incoming_qualified_quantity":78,"qualified_quantity":78,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"8d3d4ecd-eb29-4af2-83be-2d76618cac50","order_date":"2026-03-07","project_no":"26022505-01","product_model":"258-462","length_mm":140,"operation":"CNC2","standard_seconds":700,"incoming_qualified_quantity":51,"qualified_quantity":51,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"8d3d4ecd-eb29-4af2-83be-2d76618cac50","order_date":"2026-03-19","project_no":"26030903-01","product_model":"222-148*2400","length_mm":2400,"operation":"CNC","standard_seconds":240,"incoming_qualified_quantity":144,"qualified_quantity":138,"defect_quantity_1":6,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"b3249c63-79cb-4aad-9403-f971e89c215d","order_date":"2026-03-16","project_no":"26012605-07","product_model":"269-394","length_mm":243.5,"operation":"CNC","standard_seconds":500,"incoming_qualified_quantity":77,"qualified_quantity":63,"defect_quantity_1":14,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"b3249c63-79cb-4aad-9403-f971e89c215d","order_date":"2026-03-16","project_no":"26031607-03","product_model":"269-373","length_mm":133,"operation":"CNC","standard_seconds":40,"incoming_qualified_quantity":44,"qualified_quantity":44,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"b3249c63-79cb-4aad-9403-f971e89c215d","order_date":"2026-03-16","project_no":"25090202-15","product_model":"286-473","length_mm":190,"operation":"CNC","standard_seconds":160,"incoming_qualified_quantity":60,"qualified_quantity":60,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"17842c7d-961b-427f-9120-3b4aef5159a7","order_date":"2026-03-19","project_no":"","product_model":"03-10","length_mm":2015,"operation":"CNC","standard_seconds":120,"incoming_qualified_quantity":10,"qualified_quantity":10,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"17842c7d-961b-427f-9120-3b4aef5159a7","order_date":"2026-03-19","project_no":"","product_model":"03-03","length_mm":334,"operation":"CNC1","standard_seconds":75,"incoming_qualified_quantity":43,"qualified_quantity":43,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"17842c7d-961b-427f-9120-3b4aef5159a7","order_date":"2026-03-19","project_no":"","product_model":"03-03","length_mm":334,"operation":"CNC2","standard_seconds":160,"incoming_qualified_quantity":43,"qualified_quantity":43,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"17842c7d-961b-427f-9120-3b4aef5159a7","order_date":"2026-03-19","project_no":"","product_model":"03-02","length_mm":384,"operation":"CNC1","standard_seconds":90,"incoming_qualified_quantity":46,"qualified_quantity":44,"defect_quantity_1":2,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"17842c7d-961b-427f-9120-3b4aef5159a7","order_date":"2026-03-19","project_no":"","product_model":"03-02","length_mm":384,"operation":"CNC2","standard_seconds":180,"incoming_qualified_quantity":44,"qualified_quantity":44,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-06","project_no":"","product_model":"03-03","length_mm":171.5,"operation":"CNC1","standard_seconds":75,"incoming_qualified_quantity":43,"qualified_quantity":41,"defect_quantity_1":2,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-06","project_no":"","product_model":"03-02","length_mm":171.5,"operation":"CNC1","standard_seconds":90,"incoming_qualified_quantity":42,"qualified_quantity":42,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-06","project_no":"","product_model":"03-02","length_mm":171.5,"operation":"CNC2","standard_seconds":180,"incoming_qualified_quantity":42,"qualified_quantity":42,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-12","project_no":"26030701-01","product_model":"258-481","length_mm":770,"operation":"CNC","standard_seconds":100,"incoming_qualified_quantity":44,"qualified_quantity":44,"defect_quantity_1":0,"defect_reason_1":null,"defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-12","project_no":"26030516-01","product_model":"269-390","length_mm":380.85,"operation":"CNC1","standard_seconds":270,"incoming_qualified_quantity":31,"qualified_quantity":29,"defect_quantity_1":2,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null},{"employee_id":"dad80d32-4cc9-4c3c-ac2f-244b99b84be8","order_date":"2026-03-12","project_no":"26030516-01","product_model":"269-390","length_mm":380.85,"operation":"CNC2","standard_seconds":160,"incoming_qualified_quantity":30,"qualified_quantity":28,"defect_quantity_1":2,"defect_reason_1":"加工","defect_quantity_2":0,"defect_reason_2":"原料","data_category":"A","remark":null}]$item_json$)
    as x(
      employee_id uuid,
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
  join target_orders o on o.employee_id = i.employee_id and o.order_date = i.order_date
  left join public.sales_orders so on so.project_no = i.project_no
), inserted_items as (
  insert into public.production_order_items (
    order_id, project_no, product_model, length_mm, customer_model, operation,
    standard_seconds, incoming_qualified_quantity, qualified_quantity,
    defect_quantity_1, defect_reason_1, defect_quantity_2, defect_reason_2,
    data_category, remark
  )
  select
    p.order_id, p.project_no, p.product_model, p.length_mm, p.customer_model, p.operation,
    p.standard_seconds, p.incoming_qualified_quantity, p.qualified_quantity,
    p.defect_quantity_1, p.defect_reason_1, p.defect_quantity_2, p.defect_reason_2,
    p.data_category, p.remark
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
  10::integer as expected_process_standards,
  14::integer as expected_orders,
  41::integer as expected_items,
  (select count(*) from upsert_process) as touched_process_standards,
  (select count(*) from inserted_orders) as inserted_orders,
  (select count(*) from inserted_items) as inserted_items;
