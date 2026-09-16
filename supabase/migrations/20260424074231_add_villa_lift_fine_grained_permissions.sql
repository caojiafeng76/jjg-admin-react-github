-- 别墅梯模块按钮级细粒度权限
-- 新增 12 个 feature 权限，覆盖 3 个子页面的每一个操作按钮

INSERT INTO public.permissions (key, scope, module, surface, label, description)
VALUES
  -- ── 订单管理 ─────────────────────────────────────────────
  (
    'feature:villa-lift-order.create',
    'feature', 'villa-lift', 'pc',
    '别墅梯订单-新建',
    '控制「新建订单」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.edit',
    'feature', 'villa-lift', 'pc',
    '别墅梯订单-编辑',
    '控制订单行内「编辑」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.edit-items',
    'feature', 'villa-lift', 'pc',
    '别墅梯订单-编辑明细',
    '控制展开行中「编辑明细」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.delete',
    'feature', 'villa-lift', 'pc',
    '别墅梯订单-批量删除',
    '控制「批量删除」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.close',
    'feature', 'villa-lift', 'pc',
    '别墅梯订单-批量结案',
    '控制「批量结案」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.reopen',
    'feature', 'villa-lift', 'pc',
    '别墅梯订单-批量反结案',
    '控制「批量反结案」按钮的可见性'
  ),

  -- ── 切割工序 ─────────────────────────────────────────────
  (
    'feature:villa-lift-cutting.create',
    'feature', 'villa-lift', 'pc',
    '别墅梯切割-新建',
    '控制「新建切割记录」按钮的可见性'
  ),
  (
    'feature:villa-lift-cutting.edit',
    'feature', 'villa-lift', 'pc',
    '别墅梯切割-编辑',
    '控制切割记录行内「编辑」按钮的可见性'
  ),
  (
    'feature:villa-lift-cutting.delete',
    'feature', 'villa-lift', 'pc',
    '别墅梯切割-批量删除',
    '控制切割记录「批量删除」按钮的可见性'
  ),

  -- ── 加工工序 ─────────────────────────────────────────────
  (
    'feature:villa-lift-finishing.create',
    'feature', 'villa-lift', 'pc',
    '别墅梯加工-新建',
    '控制「新建加工记录」按钮的可见性'
  ),
  (
    'feature:villa-lift-finishing.edit',
    'feature', 'villa-lift', 'pc',
    '别墅梯加工-编辑',
    '控制加工记录行内「编辑」按钮的可见性'
  ),
  (
    'feature:villa-lift-finishing.delete',
    'feature', 'villa-lift', 'pc',
    '别墅梯加工-批量删除',
    '控制加工记录「批量删除」按钮的可见性'
  )
ON CONFLICT (key) DO NOTHING;;
