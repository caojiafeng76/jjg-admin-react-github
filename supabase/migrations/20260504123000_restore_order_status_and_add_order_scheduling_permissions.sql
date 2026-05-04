update public.permissions
set label = '订单现状菜单'
where key = 'nav:production-scheduling';
update public.permissions
set label = '订单现状'
where key = 'page:production-scheduling';
insert into public.permissions (key, scope, module, surface, label)
values (
    'nav:order-scheduling',
    'nav',
    'order-scheduling',
    'pc',
    '订单排产菜单'
  ),
  (
    'page:order-scheduling',
    'page',
    'order-scheduling',
    'pc',
    '订单排产'
  ) on conflict (key) do
update
set scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label;
insert into public.role_permissions (role, permission_id)
select 'admin',
  id
from public.permissions
where key in ('nav:order-scheduling', 'page:order-scheduling') on conflict (role, permission_id) do nothing;