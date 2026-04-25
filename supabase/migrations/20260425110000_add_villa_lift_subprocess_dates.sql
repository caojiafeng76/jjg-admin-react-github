-- 别墅梯订单：新增轿箱/中分门/井架加工完成日期字段及对应按钮权限
ALTER TABLE villa_lift_orders
ADD COLUMN IF NOT EXISTS cabin_processing_date date,
  ADD COLUMN IF NOT EXISTS middle_door_processing_date date,
  ADD COLUMN IF NOT EXISTS frame_processing_date date;
COMMENT ON COLUMN villa_lift_orders.cabin_processing_date IS '轿箱加工完成日期';
COMMENT ON COLUMN villa_lift_orders.middle_door_processing_date IS '中分门加工完成日期';
COMMENT ON COLUMN villa_lift_orders.frame_processing_date IS '井架加工完成日期';
-- 注册三个按钮权限
INSERT INTO permissions (key, scope, module, surface, label, description)
VALUES (
    'feature:villa-lift-order.mark-cabin-processing',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-轿箱加工完成',
    '控制「轿箱加工完成」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.mark-middle-door-processing',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-中分门加工完成',
    '控制「中分门加工完成」按钮的可见性'
  ),
  (
    'feature:villa-lift-order.mark-frame-processing',
    'feature',
    'villa-lift',
    'pc',
    '别墅梯订单-井架加工完成',
    '控制「井架加工完成」按钮的可见性'
  ) ON CONFLICT (key) DO NOTHING;
-- 默认授权：与其他 mark-* 权限保持一致
INSERT INTO role_permissions (role, permission_id)
SELECT r.role,
  p.id
FROM (
    VALUES ('precision_cutting_admin'),
      ('villa_elevator_attendant')
  ) AS r(role)
  CROSS JOIN permissions p
WHERE p.key IN (
    'feature:villa-lift-order.mark-cabin-processing',
    'feature:villa-lift-order.mark-middle-door-processing',
    'feature:villa-lift-order.mark-frame-processing'
  ) ON CONFLICT DO NOTHING;
-- 屠家辉单独授权
INSERT INTO user_permission_overrides (employee_id, permission_id, enabled)
SELECT e.id,
  p.id,
  true
FROM employees e
  CROSS JOIN permissions p
WHERE e.name = '屠家辉'
  AND p.key IN (
    'feature:villa-lift-order.mark-cabin-processing',
    'feature:villa-lift-order.mark-middle-door-processing',
    'feature:villa-lift-order.mark-frame-processing'
  ) ON CONFLICT (employee_id, permission_id) DO
UPDATE
SET enabled = EXCLUDED.enabled;