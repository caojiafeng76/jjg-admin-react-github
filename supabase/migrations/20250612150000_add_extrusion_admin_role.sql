-- 新增 extrusion_admin（挤压主任）角色
-- 挤压主任拥有：订单管理（workshop）所有权限 + 挤压生产（extrusion-production）所有权限
--
-- 依赖：
--   20260421120000_create_roles_table.sql        (roles 表)
--   20260421110000_create_rbac_permission_system.sql (permissions / role_permissions 表)

-- ============================================================
-- 1. 在 roles 表中注册 extrusion_admin 内置角色
-- ============================================================
INSERT INTO public.roles (key, label, description, is_builtin)
VALUES ('extrusion_admin', '挤压主任', '挤压主任：拥有订单管理和挤压生产的所有权限', true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_builtin = true;

-- ============================================================
-- 2. 授予 extrusion_admin 所有 PC 端导航权限（nav:* surface in pc/both）
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'nav'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ============================================================
-- 3. 授予 extrusion_admin 所有 PC 端页面权限（page:* surface = pc）
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'page'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ============================================================
-- 4. 授予 extrusion_admin 所有功能权限（feature:*）
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'feature'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ============================================================
-- 5. 授予 extrusion_admin 所有字段级权限（field:*）
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'field'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;
