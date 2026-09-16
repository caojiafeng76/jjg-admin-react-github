-- ============================================================
-- 别墅梯模块按钮级细粒度权限
--
-- 新增 12 个 feature 权限，覆盖 3 个子页面的每一个操作按钮：
--
-- 订单管理（villa-lift-order）
--   feature:villa-lift-order.create       新建订单
--   feature:villa-lift-order.edit         编辑订单（行内）
--   feature:villa-lift-order.edit-items   编辑订单明细（展开行）
--   feature:villa-lift-order.delete       批量删除订单
--   feature:villa-lift-order.close        批量结案
--   feature:villa-lift-order.reopen       批量反结案
--
-- 切割工序（villa-lift-cutting）
--   feature:villa-lift-cutting.create     新建切割记录
--   feature:villa-lift-cutting.edit       编辑切割记录（行内）
--   feature:villa-lift-cutting.delete     批量删除切割记录
--
-- 加工工序（villa-lift-finishing）
--   feature:villa-lift-finishing.create   新建加工记录
--   feature:villa-lift-finishing.edit     编辑加工记录（行内）
--   feature:villa-lift-finishing.delete   批量删除加工记录
--
-- 注意：auto_grant_to_admin trigger 会在 INSERT 时自动给 admin 角色授权，
--       其他角色默认无权限，在权限管理 UI 中按需分配。
-- ============================================================
INSERT INTO public.permissions (key, scope, module, surface, label, description)
VALUES -- ── 订单管理 ─────────────────────────────────────────────
  (
    'feature:villa-lift-order.create',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-新建',
    '控制「新建订单」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.edit',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-编辑',
    '控制订单行内「编辑」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.edit-items',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-编辑明细',
    '控制展开行中「编辑明细」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.delete',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-批量删除',
    '控制「批量删除」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.close',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-批量结案',
    '控制「批量结案」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.reopen',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-批量反结案',
    '控制「批量反结案」按钮的可见性'
  ),
  -- ── 切割工序 ─────────────────────────────────────────────
  (
    'feature:villa-lift-cutting.create',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯切割-新建',
    '控制「新建切割记录」按钮的可见性'
  ),
  (
    'feature:villa-lift-cutting.edit',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯切割-编辑',
    '控制切割记录行内「编辑」按钮的可见性'
  ),
  (
    'feature:villa-lift-cutting.delete',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯切割-批量删除',
    '控制切割记录「批量删除」按钮的可见性'
  ),
  -- ── 加工工序 ─────────────────────────────────────────────
  (
    'feature:villa-lift-finishing.create',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯加工-新建',
    '控制「新建加工记录」按钮的可见性'
  ),
  (
    'feature:villa-lift-finishing.edit',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯加工-编辑',
    '控制加工记录行内「编辑」按钮的可见性'
  ),
  (
    'feature:villa-lift-finishing.delete',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯加工-批量删除',
    '控制加工记录「批量删除」按钮的可见性'
  ) ON CONFLICT (key) DO NOTHING;
-- ============================================================
-- 兼容性授权：将 12 个 feature 权限同步授予
-- precision_cutting_admin 和 villa_elevator_attendant 两个角色，
-- 保持其与改造前「page:* 权限隐式覆盖所有编辑操作」等价的能力。
-- 后续可在权限管理 UI 中按需移除单个 feature 权限。
-- ============================================================
INSERT INTO public.role_permissions (role, permission_id)
SELECT r.role,
  p.id
FROM (
    VALUES ('precision_cutting_admin'),
      ('villa_elevator_attendant')
  ) AS r(role),
  public.permissions p
WHERE p.key IN (
    'feature:villa-lift-order.create',
    'feature:villa-lift-order.edit',
    'feature:villa-lift-order.edit-items',
    'feature:villa-lift-order.delete',
    'feature:villa-lift-order.close',
    'feature:villa-lift-order.reopen',
    'feature:villa-lift-cutting.create',
    'feature:villa-lift-cutting.edit',
    'feature:villa-lift-cutting.delete',
    'feature:villa-lift-finishing.create',
    'feature:villa-lift-finishing.edit',
    'feature:villa-lift-finishing.delete'
  ) ON CONFLICT DO NOTHING;