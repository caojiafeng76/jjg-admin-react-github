-- 在 production_sheets 表中添加 working_hours 字段
ALTER TABLE production_sheets 
ADD COLUMN IF NOT EXISTS working_hours NUMERIC;

-- 迁移数据：将 production_records 的 working_hours 迁移到对应的 production_sheets
-- 对于每个产量单，取第一条记录的 working_hours 值（因为同一个产量单下的所有记录的工时都是相同的）
UPDATE production_sheets ps
SET working_hours = (
  SELECT pr.working_hours
  FROM production_records pr
  WHERE pr.production_sheet_id = ps.id
    AND pr.working_hours IS NOT NULL
  ORDER BY pr.created_at ASC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM production_records pr
  WHERE pr.production_sheet_id = ps.id
    AND pr.working_hours IS NOT NULL
);;
