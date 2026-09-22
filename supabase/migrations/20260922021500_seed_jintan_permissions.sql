insert into public.permissions (key, scope, module, surface, label)
values
  ('nav:jintan', 'nav', 'jintan', 'pc', '金檀木业菜单分组'),
  ('page:jintan-parts-inventory', 'page', 'jintan', 'pc', '配件库存'),
  ('page:jintan-parts-stock-in', 'page', 'jintan', 'pc', '配件入库'),
  ('page:jintan-parts-stock-out', 'page', 'jintan', 'pc', '配件出库')
on conflict (key) do nothing;;
