-- 同时启动两次：库存 10，两次各出库 7，必须只有一次成功。
begin;
with created as (
  insert into public.jintan_parts_stock_out (inventory_id, quantity, remarks)
  select id, 7, '并发验证'
  from public.jintan_parts_inventory
  where part_data_id = 'e78f4adc-bdae-4f96-8a9a-5c93428ea41d'
  returning id
)
select id, pg_sleep(5) from created;
commit;
