-- 别墅梯订单主表添加生产进度日期字段
-- 挑料、喷涂、贴膜、切割（要求/实际）、加工（要求/实际）、检验完成日期
ALTER TABLE villa_lift_orders
ADD COLUMN IF NOT EXISTS material_selection_date date,
  ADD COLUMN IF NOT EXISTS painting_date date,
  ADD COLUMN IF NOT EXISTS film_date date,
  ADD COLUMN IF NOT EXISTS cutting_required_date date,
  ADD COLUMN IF NOT EXISTS cutting_actual_date date,
  ADD COLUMN IF NOT EXISTS processing_required_date date,
  ADD COLUMN IF NOT EXISTS processing_actual_date date,
  ADD COLUMN IF NOT EXISTS inspection_date date;
COMMENT ON COLUMN villa_lift_orders.material_selection_date IS '挑料完成日期';
COMMENT ON COLUMN villa_lift_orders.painting_date IS '喷涂完成日期';
COMMENT ON COLUMN villa_lift_orders.film_date IS '贴膜完成日期';
COMMENT ON COLUMN villa_lift_orders.cutting_required_date IS '切割要求完成日期';
COMMENT ON COLUMN villa_lift_orders.cutting_actual_date IS '切割实际完成日期';
COMMENT ON COLUMN villa_lift_orders.processing_required_date IS '加工要求完成日期';
COMMENT ON COLUMN villa_lift_orders.processing_actual_date IS '加工实际完成日期';
COMMENT ON COLUMN villa_lift_orders.inspection_date IS '检验完成日期';