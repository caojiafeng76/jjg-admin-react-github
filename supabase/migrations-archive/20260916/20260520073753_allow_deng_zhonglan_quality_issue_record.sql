insert into public.permissions (key, scope, module, surface, label, description)
values
  (
    'nav:quality',
    'nav',
    'quality',
    'pc',
    '质量菜单分组',
    null
  ),
  (
    'page:quality-issue-record',
    'page',
    'quality',
    'pc',
    '质量问题记录单',
    null
  )
on conflict (key) do update
set scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label,
  description = excluded.description;

insert into public.user_permission_overrides (employee_id, permission_id, enabled)
select e.id,
  p.id,
  true
from public.employees e
cross join public.permissions p
where e.id = '89946107-62cb-49db-af0c-25a0caed6c8e'::uuid
  and e.name = '邓中兰'
  and e.auth_user_id = 'f8c04016-54c5-4228-9311-52184a8a255e'::uuid
  and e.role = 'precision_cutting_admin'
  and e.is_active = true
  and p.key in ('nav:quality', 'page:quality-issue-record')
on conflict (employee_id, permission_id) do update
set enabled = excluded.enabled;
