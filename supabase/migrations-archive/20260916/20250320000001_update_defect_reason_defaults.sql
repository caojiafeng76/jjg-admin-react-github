-- 修改production_order_items表，设置defect_reason_1和defect_reason_2的默认值
ALTER TABLE public.production_order_items 
ALTER COLUMN defect_reason_1 SET DEFAULT '加工',
ALTER COLUMN defect_reason_2 SET DEFAULT '原料';

-- 更新现有数据
UPDATE public.production_order_items 
SET defect_reason_1 = '加工' 
WHERE defect_reason_1 IS NULL;

UPDATE public.production_order_items 
SET defect_reason_2 = '原料' 
WHERE defect_reason_2 IS NULL;