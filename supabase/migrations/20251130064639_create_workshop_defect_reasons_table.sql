-- 创建不良原因管理表
CREATE TABLE IF NOT EXISTS workshop_defect_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  defect_reason TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE TRIGGER update_workshop_defect_reasons_updated_at
  BEFORE UPDATE ON workshop_defect_reasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE workshop_defect_reasons IS '车间不良原因管理表';
COMMENT ON COLUMN workshop_defect_reasons.defect_reason IS '不良原因';;
