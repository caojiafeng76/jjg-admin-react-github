insert into public.role_permissions (role, permission_id)
select 'admin',
  id
from public.permissions
where key in ('nav:order-scheduling', 'page:order-scheduling') on conflict (role, permission_id) do nothing;