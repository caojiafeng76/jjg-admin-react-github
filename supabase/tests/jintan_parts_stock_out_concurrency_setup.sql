-- 专用并发验证配件；由 transaction.sql 的清理段删除，不使用业务配件。
begin;
insert into public.jintan_parts_data (id, part_name)
values ('e78f4adc-bdae-4f96-8a9a-5c93428ea41d', '__出库并发验证__');
update public.jintan_parts_inventory set quantity = 10
where part_data_id = 'e78f4adc-bdae-4f96-8a9a-5c93428ea41d';
commit;
select quantity from public.jintan_parts_inventory
where part_data_id = 'e78f4adc-bdae-4f96-8a9a-5c93428ea41d';
