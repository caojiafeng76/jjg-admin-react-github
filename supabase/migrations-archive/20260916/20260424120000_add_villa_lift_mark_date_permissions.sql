-- 添加别墅梯订单"标记完成日期"按钮级权限
-- 涵盖：挑料完成、喷涂完成、贴膜完成、切割完成
INSERT INTO permissions (key, scope, module, surface, label, description)
VALUES (
    'feature:villa-lift-order.mark-material',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-挑料完成',
    '控制「挑料完成」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.mark-painting',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-喷涂完成',
    '控制「喷涂完成」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.mark-film',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-贴膜完成',
    '控制「贴膜完成」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.mark-cutting',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-切割完成',
    '控制「切割完成」按钮的可见性'
  ) ON CONFLICT (key) DO NOTHING;
-- 向 precision_cutting_admin 和 villa_elevator_attendant 授权
-- （admin 角色由触发器自动授权，此处仅补充非 admin 角色）
INSERT INTO role_permissions (role, permission_id)
SELECT r.role,
  p.id
FROM (
    VALUES ('precision_cutting_admin'),
      ('villa_elevator_attendant')
  ) AS r(role)
  CROSS JOIN permissions p
WHERE p.key IN (
    'feature:villa-lift-order.mark-material',
    'feature:villa-lift-order.mark-painting',
    'feature:villa-lift-order.mark-film',
    'feature:villa-lift-order.mark-cutting'
  ) ON CONFLICT DO NOTHING;