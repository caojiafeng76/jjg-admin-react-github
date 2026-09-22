insert into public.permissions (key, scope, module, surface, label)
values
  ('page:jintan-parts-data', 'page', 'jintan', 'pc', '配件资料')
on conflict (key) do nothing;
