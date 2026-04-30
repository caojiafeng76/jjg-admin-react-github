-- 限制 viewer（查看员）角色可访问范围
-- 撤销以下模块的导航/页面授权：西尼、成本核算、基础资料、生产工单。
-- 菜单通过 nav/page 权限过滤，路由通过 PermissionProtectedRoute 校验 page 权限，
-- 删除角色授权后可同时隐藏菜单并阻止直接访问对应页面。
WITH revoked_permissions AS (
  SELECT id
  FROM public.permissions
  WHERE key = ANY (
      ARRAY [
      'nav:syney',
      'page:syney-po-list',
      'page:syney-store-report-list',
      'page:syney-safe-part-setting',
      'page:syney-spec-list',
      'page:syney-setting',
      'nav:standard-time-list',
      'page:standard-time-list',
      'nav:workshop-basic',
      'page:employee-list',
      'page:job-base-setting',
      'page:machine-equipment-maintenance',
      'page:machine-runtime',
      'page:production-order'
    ]::text []
    )
)
DELETE FROM public.role_permissions rp USING revoked_permissions p
WHERE rp.role = 'viewer'
  AND rp.permission_id = p.id;
UPDATE public.roles
SET description = '可查看除西尼、成本核算、基础资料、生产工单外的已授权数据，无任何编辑权限'
WHERE key = 'viewer';