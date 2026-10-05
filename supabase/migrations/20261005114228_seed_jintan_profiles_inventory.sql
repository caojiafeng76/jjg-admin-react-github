-- 为既有型材资料补 0 库存行（幂等，不覆盖已有数量）
insert into public.jintan_profiles_inventory (
  profile_data_id,
  profile_model,
  profile_name,
  specification,
  material
)
select id, profile_model, profile_name, specification, material
from public.jintan_profiles_data
on conflict (profile_data_id) do nothing;
