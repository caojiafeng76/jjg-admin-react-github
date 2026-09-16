-- 创建工序管理表
CREATE TABLE IF NOT EXISTS workshop_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workshop_processes_updated_at
  BEFORE UPDATE ON workshop_processes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE workshop_processes IS '车间工序管理表';
COMMENT ON COLUMN workshop_processes.process_name IS '工序名称';;
