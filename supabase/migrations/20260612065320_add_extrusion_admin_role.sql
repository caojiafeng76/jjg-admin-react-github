-- 新增 extrusion_admin（挤压主任）角色
INSERT INTO public.roles (key, label, description, is_builtin)
VALUES ('extrusion_admin', '挤压主任', '挤压主任：拥有订单管理和挤压生产的所有权限', true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_builtin = true;

-- 授予 extrusion_admin 所有 PC 端导航权限（nav:* surface in pc/both）
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'nav'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 授予 extrusion_admin 所有 PC 端页面权限（page:* surface = pc）
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'page'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 授予 extrusion_admin 所有功能权限（feature:*）
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'feature'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 授予 extrusion_admin 所有字段级权限（field:*）
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'extrusion_admin',
  id
FROM public.permissions
WHERE scope = 'field'
  AND surface IN ('pc', 'both')
ON CONFLICT (role, permission_id) DO NOTHING;;
