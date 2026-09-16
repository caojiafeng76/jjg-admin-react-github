-- ============================================================
-- 邓中兰（precision_cutting_admin）加开 优迈原料出库 页面全部权限
-- 背景：角色 precision_cutting_admin 已通过 role_permissions 拥有
-- page:youmai-raw-material-stock-out（可查看），但缺少
-- feature:youmai.manage（新建/编辑/删除等写操作），导致该页面按钮被禁用。
-- 本迁移以用户级权限覆盖（user_permission_overrides）显式授予这两项权限，
-- 使其不再依赖角色默认权限即可拥有该页面的完整（读+写）权限。
-- ============================================================
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
  and p.key in ('page:youmai-raw-material-stock-out', 'feature:youmai.manage')
on conflict (employee_id, permission_id) do update
set enabled = excluded.enabled;
