INSERT INTO permissions (key, scope, module, surface, label, description)
VALUES (
    'feature:villa-lift-order.mark-processing',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-加工完成',
    '控制「加工完成」按钮的可见性'
  ) ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT r.role, p.id
FROM (
    VALUES ('precision_cutting_admin'),
      ('villa_elevator_attendant')
  ) AS r(role)
  CROSS JOIN permissions p
WHERE p.key = 'feature:villa-lift-order.mark-processing'
ON CONFLICT DO NOTHING;

INSERT INTO user_permission_overrides (employee_id, permission_id, enabled)
SELECT e.id, p.id, true
FROM employees e
  CROSS JOIN permissions p
WHERE e.name = '屠家辉'
  AND p.key = 'feature:villa-lift-order.mark-processing'
ON CONFLICT (employee_id, permission_id) DO UPDATE SET enabled = EXCLUDED.enabled;;
