
-- 删除唯一约束以允许同一工序+型号有不同工时
ALTER TABLE public.process_standards DROP CONSTRAINT IF EXISTS process_standards_operation_model_unique;
;
