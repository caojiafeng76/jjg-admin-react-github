-- 排产单表头
CREATE TABLE IF NOT EXISTS public.order_scheduling_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduling_date DATE NOT NULL,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 排产单明细
CREATE TABLE IF NOT EXISTS public.order_scheduling_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.order_scheduling_sheets(id) ON DELETE CASCADE,
  project_no TEXT NOT NULL,
  product_model TEXT,
  customer TEXT,
  customer_model TEXT,
  order_quantity NUMERIC,
  length_mm NUMERIC,
  material_code TEXT,
  material_name TEXT,
  delivery_date DATE,
  scheduled_quantity NUMERIC,
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_order_scheduling_sheets_date ON public.order_scheduling_sheets(scheduling_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_scheduling_items_sheet_id ON public.order_scheduling_items(sheet_id);

-- RLS
ALTER TABLE public.order_scheduling_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_scheduling_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order scheduling sheets authenticated rw"
  ON public.order_scheduling_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Order scheduling items authenticated rw"
  ON public.order_scheduling_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 自动更新时间戳
CREATE TRIGGER update_order_scheduling_sheets_updated_at
  BEFORE UPDATE ON public.order_scheduling_sheets FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_scheduling_items_updated_at
  BEFORE UPDATE ON public.order_scheduling_items FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();;
