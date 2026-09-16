-- ============================================================
-- 补齐吴雯雯订单管理全部权限
--
-- 背景：
-- - 吴雯雯是 viewer，不能扩大 viewer 角色默认权限。
-- - 前序迁移已授予订单管理大部分权限，但后续修复只补了
--   create / edit / delete，容易遗漏 manage-status。
-- - 这里一次性确保订单管理 nav/page/feature 权限定义存在，
--   并通过用户级覆盖授予吴雯雯订单管理全套权限。
-- ============================================================

insert into public.permissions (key, scope, module, surface, label, description)
values
  (
    'nav:workshop-order-list',
    'nav',
    'workshop-order-list',
    'pc',
    '订单管理菜单',
    null
  ),
  (
    'page:workshop-order-production',
    'page',
    'workshop-order-list',
    'pc',
    '订单管理-生产中',
    null
  ),
  (
    'page:workshop-order-closed',
    'page',
    'workshop-order-list',
    'pc',
    '订单管理-已结案',
    null
  ),
  (
    'page:workshop-order-qr-detail',
    'page',
    'workshop-order-list',
    'both',
    '订单二维码详情',
    null
  ),
  (
    'feature:workshop-order.create',
    'feature',
    'workshop-order-list',
    'pc',
    '订单管理-新建',
    '控制订单列表中"添加"按钮与新建订单入口'
  ),
  (
    'feature:workshop-order.edit',
    'feature',
    'workshop-order-list',
    'pc',
    '订单管理-编辑',
    '控制订单列表中"编辑"按钮与编辑订单入口'
  ),
  (
    'feature:workshop-order.delete',
    'feature',
    'workshop-order-list',
    'pc',
    '订单管理-删除',
    '控制订单列表中"删除"按钮与批量删除入口'
  ),
  (
    'feature:workshop-order.manage-status',
    'feature',
    'workshop-order-list',
    'pc',
    '订单管理-状态变更',
    '控制订单结案/反结案等状态批量操作入口'
  )
on conflict (key) do update
set
  scope = excluded.scope,
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
where e.id = '91e20061-7058-4ddb-8aaf-ea33ea141857'::uuid
  and e.name = '吴雯雯'
  and e.auth_user_id = '230a0803-6136-41ac-9674-1bfb1dac89ab'::uuid
  and e.role = 'viewer'
  and e.is_active = true
  and p.key in (
    'nav:workshop-order-list',
    'page:workshop-order-production',
    'page:workshop-order-closed',
    'page:workshop-order-qr-detail',
    'feature:workshop-order.create',
    'feature:workshop-order.edit',
    'feature:workshop-order.delete',
    'feature:workshop-order.manage-status'
  )
on conflict (employee_id, permission_id) do update
set enabled = excluded.enabled;
