-- 新增 viewer（查看员）角色
-- 查看员只能浏览所有 PC 端菜单和页面，不具备任何 feature（增删改）和 field（字段编辑）权限
--
-- 实现原理：get_my_permissions() 只返回有 role_permissions 记录的权限
-- 因此只需授予 nav:* 和 page:* 权限，不授予任何 feature:* 或 field:* 即可
--
-- 依赖：
--   20260421120000_create_roles_table.sql        (roles 表)
--   20260421110000_create_rbac_permission_system.sql (permissions / role_permissions 表)

-- ============================================================
-- 1. 在 roles 表中注册 viewer 内置角色
-- ============================================================
INSERT INTO public.roles (key, label, description, is_builtin)
VALUES ('viewer', '查看员', '仅可查看系统所有数据，无任何编辑权限', true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_builtin = true;

-- ============================================================
-- 2. 授予 viewer 所有 PC 端导航权限（surface IN ('pc', 'both') 的 nav:*）
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer',
  id
FROM public.permissions
WHERE scope = 'nav'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;

-- ============================================================
-- 3. 授予 viewer 所有 PC 端页面权限（surface='pc' 的 page:*）
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer',
  id
FROM public.permissions
WHERE scope = 'page'
  AND surface = 'pc'
ON CONFLICT (role, permission_id) DO NOTHING;

-- ============================================================
-- 4. 授予 viewer PC+移动端共享的 page 权限（surface='both' 的 page:*）
--    让查看员也能通过 PC 访问订单二维码详情、物料转移单、生产工单等
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer',
  id
FROM public.permissions
WHERE scope = 'page'
  AND surface = 'both'
ON CONFLICT (role, permission_id) DO NOTHING;
