insert into public.permissions (key, scope, module, surface, label)
values
  ('page:jintan-materials-data', 'page', 'jintan', 'pc', '素材资料'),
  ('page:jintan-materials-inventory', 'page', 'jintan', 'pc', '素材库存'),
  ('page:jintan-materials-stock-in', 'page', 'jintan', 'pc', '素材入库'),
  ('page:jintan-materials-stock-out', 'page', 'jintan', 'pc', '素材出库')
on conflict (key) do nothing;
