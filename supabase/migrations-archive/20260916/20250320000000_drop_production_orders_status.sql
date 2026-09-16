-- 从production_orders表中删除status字段
ALTER TABLE public.production_orders DROP COLUMN IF EXISTS status;