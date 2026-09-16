-- 从 production_records 表中删除 working_hours 字段
ALTER TABLE production_records 
DROP COLUMN IF EXISTS working_hours;;
