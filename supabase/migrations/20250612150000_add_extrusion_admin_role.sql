-- extrusion_admin（挤压主任）角色：仅限 3 个页面
-- 页面：订单管理（/workshop-order-list）、挤压生产单（/extrusion-production-order）、
--       挤压生产日报表（/extrusion-production-daily-report）
--
-- 依赖：
--   20260421120000_create_roles_table.sql        (roles 表)
--   20260421110000_create_rbac_permission_system.sql (permissions / role_permissions 表)

-- ============================================================
-- 1. 在 roles 表中注册 extrusion_admin 内置角色
-- ============================================================
INSERT INTO public.roles (key, label, description, is_builtin)
VALUES ('extrusion_admin', '挤压主任', '挤压主任：仅可访问订单管理、挤压生产单和挤压生产日报表三个页面', true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_builtin = true;

-- ============================================================
-- 2. 精确授予 12 个权限（nav + page + feature）
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin', id
FROM public.permissions
WHERE key IN (
  -- 订单管理（workshop-order-list）
  -- nav
  'nav:workshop-order-list',
  -- page（生产中 + 已结案 + 二维码详情）
  'page:workshop-order-production',
  'page:workshop-order-closed',
  'page:workshop-order-qr-detail',
  -- feature（删除 + 状态变更）
  'feature:workshop-order.delete',
  'feature:workshop-order.manage-status',

  -- 挤压生产单（extrusion-production）
  -- nav
  'nav:extrusion-production',
  -- page
  'page:extrusion-production',
  -- feature（新建 + 审核 + 删除）
  'feature:extrusion-production.create',
  'feature:extrusion-production.audit',
  'feature:extrusion-production.delete',

  -- 挤压生产日报表（extrusion-production-daily-report）
  -- page
  'page:extrusion-production-daily-report'
)
ON CONFLICT (role, permission_id) DO NOTHING;
