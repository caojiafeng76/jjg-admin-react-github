-- 新增 3 个标签模板字段
ALTER TABLE syney_safe_part_settings
  ADD COLUMN IF NOT EXISTS part_model       text,
  ADD COLUMN IF NOT EXISTS part_code_prefix text,
  ADD COLUMN IF NOT EXISTS english_name     text;

-- 按 name 填充现有数据
UPDATE syney_safe_part_settings
SET
  part_model       = CASE name WHEN '梳齿支撑板' THEN 'YD1001XN' WHEN '楼层板' THEN 'YD0201XN' END,
  part_code_prefix = CASE name WHEN '梳齿支撑板' THEN 'ZC00'      WHEN '楼层板' THEN 'LC00'      END,
  english_name     = CASE name WHEN '梳齿支撑板' THEN 'COMB PLATE' WHEN '楼层板' THEN 'COVER PLATE' END
WHERE name IN ('梳齿支撑板', '楼层板');
;
