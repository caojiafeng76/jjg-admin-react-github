-- 启用所有业务表的行级安全（RLS），并为已认证用户创建统一的读写策略
-- 注意：
-- 1. 请根据实际存在的表名调整本文件；
-- 2. 策略默认：只要是 Supabase Auth 登录后的 authenticated 用户，就允许全表读写；
-- 3. 如果后续需要更细粒度的权限（按用户、按角色），可以在此基础上再细化策略。

-- 员工表
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees authenticated select" ON public.employees;
DROP POLICY IF EXISTS "Employees authenticated modify" ON public.employees;

CREATE POLICY "Employees authenticated select"
  ON public.employees
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Employees authenticated modify"
  ON public.employees
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 订单与生产相关表
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_defect_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales orders authenticated rw" ON public.sales_orders;
DROP POLICY IF EXISTS "Workshop processes authenticated rw" ON public.workshop_processes;
DROP POLICY IF EXISTS "Workshop defect reasons authenticated rw" ON public.workshop_defect_reasons;
DROP POLICY IF EXISTS "Production records authenticated rw" ON public.production_records;

CREATE POLICY "Sales orders authenticated rw"
  ON public.sales_orders
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Workshop processes authenticated rw"
  ON public.workshop_processes
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Workshop defect reasons authenticated rw"
  ON public.workshop_defect_reasons
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Production records authenticated rw"
  ON public.production_records
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Syney 相关表
ALTER TABLE public."syney-pos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."syney-po-items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."syney-serial-no" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."syney-specs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."syney-store-reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."syney-store-report-items" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Syney pos authenticated rw" ON public."syney-pos";
DROP POLICY IF EXISTS "Syney po items authenticated rw" ON public."syney-po-items";
DROP POLICY IF EXISTS "Syney serial no authenticated rw" ON public."syney-serial-no";
DROP POLICY IF EXISTS "Syney specs authenticated rw" ON public."syney-specs";
DROP POLICY IF EXISTS "Syney store reports authenticated rw" ON public."syney-store-reports";
DROP POLICY IF EXISTS "Syney store report items authenticated rw" ON public."syney-store-report-items";

CREATE POLICY "Syney pos authenticated rw"
  ON public."syney-pos"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Syney po items authenticated rw"
  ON public."syney-po-items"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Syney serial no authenticated rw"
  ON public."syney-serial-no"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Syney specs authenticated rw"
  ON public."syney-specs"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Syney store reports authenticated rw"
  ON public."syney-store-reports"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Syney store report items authenticated rw"
  ON public."syney-store-report-items"
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


