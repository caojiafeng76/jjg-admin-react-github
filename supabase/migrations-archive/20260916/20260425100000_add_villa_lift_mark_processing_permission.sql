-- 添加别墅梯订单"加工完成"按钮级权限
-- admin 角色由触发器自动授权
INSERT INTO permissions (key, scope, module, surface, label, description)
VALUES (
    'feature:villa-lift-order.mark-processing',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-加工完成',
    '控制「加工完成」按钮的可见性'
  ) ON CONFLICT (key) DO NOTHING;
-- 向 precision_cutting_admin 和 villa_elevator_attendant 授权（与其他 mark-* 权限保持一致）
INSERT INTO role_permissions (role, permission_id)
SELECT r.role,
  p.id
FROM (
    VALUES ('precision_cutting_admin'),
      ('villa_elevator_attendant')
  ) AS r(role)
  CROSS JOIN permissions p
WHERE p.key = 'feature:villa-lift-order.mark-processing' ON CONFLICT DO NOTHING;
-- 单独给员工屠家辉（employee 角色）开通此权限，使用 user_permission_overrides
INSERT INTO user_permission_overrides (employee_id, permission_id, enabled)
SELECT e.id,
  p.id,
  true
FROM employees e
  CROSS JOIN permissions p
WHERE e.name = '屠家辉'
  AND p.key = 'feature:villa-lift-order.mark-processing' ON CONFLICT (employee_id, permission_id) DO
UPDATE
SET enabled = EXCLUDED.enabled;