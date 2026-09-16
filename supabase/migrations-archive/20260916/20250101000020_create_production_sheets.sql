-- 创建产量单表
CREATE TABLE IF NOT EXISTS public.production_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_date DATE NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 修改产量记录表，添加产量单ID字段
ALTER TABLE public.production_records 
ADD COLUMN IF NOT EXISTS production_sheet_id UUID REFERENCES public.production_sheets(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_production_sheets_date ON public.production_sheets(production_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_records_sheet_id ON public.production_records(production_sheet_id);

-- 启用RLS
ALTER TABLE public.production_sheets ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Production sheets authenticated rw"
  ON public.production_sheets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 更新updated_at触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_production_sheets_updated_at
  BEFORE UPDATE ON public.production_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

