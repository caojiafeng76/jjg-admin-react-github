-- 创建产量录入表
CREATE TABLE IF NOT EXISTS production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES workshop_processes(id) ON DELETE CASCADE,
  qualified_quantity INTEGER NOT NULL DEFAULT 0 CHECK (qualified_quantity >= 0),
  defective_quantity INTEGER NOT NULL DEFAULT 0 CHECK (defective_quantity >= 0),
  defect_reason_id UUID REFERENCES workshop_defect_reasons(id) ON DELETE SET NULL,
  operator_ids UUID[] NOT NULL DEFAULT '{}' CHECK (array_length(operator_ids, 1) > 0),
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE TRIGGER update_production_records_updated_at
  BEFORE UPDATE ON production_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_production_records_date ON production_records(production_date);
CREATE INDEX IF NOT EXISTS idx_production_records_order_id ON production_records(order_id);
CREATE INDEX IF NOT EXISTS idx_production_records_process_id ON production_records(process_id);;
