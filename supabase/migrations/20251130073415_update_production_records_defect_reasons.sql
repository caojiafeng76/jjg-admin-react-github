-- 修改产量录入表，支持多个不良原因
-- 先删除旧的约束和字段
ALTER TABLE production_records 
  DROP CONSTRAINT IF EXISTS production_records_defect_reason_id_fkey,
  DROP COLUMN IF EXISTS defect_reason_id,
  DROP COLUMN IF EXISTS defective_quantity;

-- 添加新的字段：不良原因详情（JSON数组）
-- 格式: [{"defect_reason_id": "uuid", "quantity": 1}, ...]
ALTER TABLE production_records 
  ADD COLUMN defect_reasons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN defective_quantity INTEGER NOT NULL DEFAULT 0 CHECK (defective_quantity >= 0);

-- 添加检查约束，确保 defect_reasons 是数组格式
ALTER TABLE production_records 
  ADD CONSTRAINT check_defect_reasons_is_array 
  CHECK (jsonb_typeof(defect_reasons) = 'array');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_production_records_defect_reasons 
  ON production_records USING GIN (defect_reasons);;
