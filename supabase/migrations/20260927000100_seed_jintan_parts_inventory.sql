-- 为既有配件资料补 0 库存行（幂等，不覆盖已有数量）
insert into public.jintan_parts_inventory (
  part_data_id,
  part_name,
  specification,
  material,
  supplier
)
select id, part_name, specification, material, supplier
from public.jintan_parts_data
on conflict (part_data_id) do nothing;
