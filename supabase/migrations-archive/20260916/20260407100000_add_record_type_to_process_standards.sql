-- 向 process_standards 表添加 record_type 字段
-- A 类型（有料号）：按料号+型号+长度匹配工序和标准工时
-- B 类型（无料号）：按型号匹配工序和标准工时
-- 1. 添加 record_type 字段（初始允许 NULL，以便批量更新）
ALTER TABLE process_standards
ADD COLUMN record_type text CHECK (record_type IN ('A', 'B'));
-- 2. 根据 part_no 是否填写来初始化现有数据
--    有料号（part_no IS NOT NULL AND part_no <> ''）→ A 类型
--    无料号 → B 类型
UPDATE process_standards
SET record_type = CASE
    WHEN part_no IS NOT NULL
    AND part_no <> '' THEN 'A'
    ELSE 'B'
  END;
-- 3. 设置为非空约束，并添加默认值 'B'
ALTER TABLE process_standards
ALTER COLUMN record_type
SET NOT NULL;
ALTER TABLE process_standards
ALTER COLUMN record_type
SET DEFAULT 'B';