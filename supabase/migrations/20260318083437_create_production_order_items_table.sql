-- 创建工序明细表
CREATE TABLE public.production_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  project_no TEXT NOT NULL,
  product_model TEXT,
  length_mm NUMERIC(10,2),
  customer_model TEXT,
  operation TEXT NOT NULL,
  standard_seconds NUMERIC(10,2) NOT NULL,
  qualified_quantity INTEGER NOT NULL DEFAULT 0 CHECK (qualified_quantity >= 0),
  qualified_hours NUMERIC(10,2) GENERATED ALWAYS AS (qualified_quantity * standard_seconds / 3600.0) STORED,
  defect_quantity_1 INTEGER NOT NULL DEFAULT 0 CHECK (defect_quantity_1 >= 0),
  defect_reason_1 TEXT CHECK (defect_reason_1 IS NULL OR defect_reason_1 IN ('加工', '原料', '其他')),
  defect_quantity_2 INTEGER NOT NULL DEFAULT 0 CHECK (defect_quantity_2 >= 0),
  defect_reason_2 TEXT CHECK (defect_reason_2 IS NULL OR defect_reason_2 IN ('加工', '原料', '其他')),
  defect_hours NUMERIC(10,2) GENERATED ALWAYS AS (
    (CASE WHEN defect_reason_1 = '加工' THEN defect_quantity_1 * 2 * standard_seconds ELSE 0 END +
     CASE WHEN defect_reason_2 = '加工' THEN defect_quantity_2 * 2 * standard_seconds ELSE 0 END) / 3600.0
  ) STORED,
  bonus_seconds INTEGER NOT NULL DEFAULT 0 CHECK (bonus_seconds >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "启用工序明细表的RLS" ON public.production_order_items FOR ALL USING (true) WITH CHECK (true);

-- 添加注释
COMMENT ON TABLE public.production_order_items IS '工序明细表';
COMMENT ON COLUMN production_order_items.order_id IS '生产工单ID';
COMMENT ON COLUMN production_order_items.project_no IS '项目号';
COMMENT ON COLUMN production_order_items.product_model IS '型号';
COMMENT ON COLUMN production_order_items.length_mm IS '长度(mm)';
COMMENT ON COLUMN production_order_items.customer_model IS '客户型号';
COMMENT ON COLUMN production_order_items.operation IS '工序';
COMMENT ON COLUMN production_order_items.standard_seconds IS '标准工时(秒)';
COMMENT ON COLUMN production_order_items.qualified_quantity IS '合格数量';
COMMENT ON COLUMN production_order_items.qualified_hours IS '合格工时(小时)';
COMMENT ON COLUMN production_order_items.defect_quantity_1 IS '不良数量-原因1';
COMMENT ON COLUMN production_order_items.defect_reason_1 IS '不良原因1';
COMMENT ON COLUMN production_order_items.defect_quantity_2 IS '不良数量-原因2';
COMMENT ON COLUMN production_order_items.defect_reason_2 IS '不良原因2';
COMMENT ON COLUMN production_order_items.defect_hours IS '减分工时(小时)';
COMMENT ON COLUMN production_order_items.bonus_seconds IS '加分项(秒)';;
