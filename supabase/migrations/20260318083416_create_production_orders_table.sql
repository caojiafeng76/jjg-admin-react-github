-- 创建生产工单表
CREATE TABLE public.production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_date DATE NOT NULL DEFAULT (CURRENT_DATE - INTERVAL '1 day'),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  work_hours NUMERIC(6,2) NOT NULL CHECK (work_hours > 0),
  total_qualified_hours NUMERIC(10,2),
  efficiency NUMERIC(5,4),
  status TEXT NOT NULL DEFAULT '进行中'::text CHECK (status IN ('进行中', '已完成', '已取消')),
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "启用生产工单表的RLS" ON public.production_orders FOR ALL USING (true) WITH CHECK (true);

-- 添加注释
COMMENT ON TABLE public.production_orders IS '生产工单表';
COMMENT ON COLUMN production_orders.order_date IS '日期';
COMMENT ON COLUMN production_orders.employee_id IS '操作人';
COMMENT ON COLUMN production_orders.work_hours IS '出勤工时(小时)';
COMMENT ON COLUMN production_orders.total_qualified_hours IS '合格工时(小时)';
COMMENT ON COLUMN production_orders.efficiency IS '工时效率';
COMMENT ON COLUMN production_orders.status IS '状态';
COMMENT ON COLUMN production_orders.remark IS '备注';;
