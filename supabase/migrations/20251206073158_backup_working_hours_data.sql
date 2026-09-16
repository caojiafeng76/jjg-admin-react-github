-- 创建备份表，保存 production_records 的 working_hours 数据
CREATE TABLE IF NOT EXISTS production_records_working_hours_backup AS
SELECT 
  pr.id as record_id,
  pr.production_sheet_id,
  pr.working_hours,
  pr.created_at as backup_created_at
FROM production_records pr
WHERE pr.working_hours IS NOT NULL;

-- 创建索引以便后续查询
CREATE INDEX IF NOT EXISTS idx_backup_sheet_id ON production_records_working_hours_backup(production_sheet_id);;
