-- ============================================================
-- 新增 4 个 admin-only feature 权限
-- 配套前端硬编码 (role === 'admin') 替换为 can('feature:xxx') 的改动
--
-- 同步：src/config/permissionRegistry.ts、src/features/workshop/permissions.ts
--
-- 注意：auto_grant_to_admin trigger 会在 INSERT 时自动给 admin 角色授权，
--       因此本 migration 不需要手动 INSERT role_permissions。
-- ============================================================
INSERT INTO public.permissions (key, scope, module, surface, label, description)
VALUES (
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
  ),
  (
    'feature:admin-notifications.view',
    'feature',
    'admin-notifications',
    'pc',
    '通知中心-查看',
    '控制顶栏通知铃图标与通知列表的可见性，未授权用户不订阅 admin 通知 realtime'
  ),
  (
    'feature:admin-management-password.update',
    'feature',
    'admin-management-password',
    'pc',
    '管理密码-修改',
    '控制顶栏「修改管理密码」入口可见性'
  ) ON CONFLICT (key) DO NOTHING;