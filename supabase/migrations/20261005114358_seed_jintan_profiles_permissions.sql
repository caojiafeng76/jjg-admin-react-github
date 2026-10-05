insert into public.permissions (key, scope, module, surface, label)
values
  ('page:jintan-profiles-data', 'page', 'jintan', 'pc', '型材资料'),
  ('page:jintan-profiles-inventory', 'page', 'jintan', 'pc', '型材库存'),
  ('page:jintan-profiles-stock-in', 'page', 'jintan', 'pc', '型材入库'),
  ('page:jintan-profiles-stock-out', 'page', 'jintan', 'pc', '型材出库')
on conflict (key) do nothing;
