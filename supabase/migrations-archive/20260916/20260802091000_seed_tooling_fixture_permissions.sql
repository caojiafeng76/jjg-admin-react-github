insert into public.permissions (key, scope, module, surface, label)
values
  ('nav:tooling-fixture', 'nav', 'tooling-fixture', 'pc', '工装管理菜单分组'),
  ('page:fixture-data', 'page', 'tooling-fixture', 'pc', '工装资料'),
  ('page:fixture-records', 'page', 'tooling-fixture', 'pc', '工装出入记录')
on conflict (key) do nothing;
