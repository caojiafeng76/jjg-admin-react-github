-- 给"前端有 page 权限但数据库 RLS 卡死"的业务表追加 permission-based 策略。
-- 与现有 admin / team_leader / employee scoped 策略 OR 共存，不破坏旧行为。
-- 设计原则：拿到 page:xxx 权限 = 拿到对应表 CRUD 权限；
--           employees 表特殊，只放开 SELECT，写仍限 admin（避免越权改 role/密码）。

-- ========== attendance_details ==========
DROP POLICY IF EXISTS "attendance_details permission rw" ON public.attendance_details;
CREATE POLICY "attendance_details permission rw" ON public.attendance_details
  FOR ALL TO authenticated
  USING (
    public.current_user_has_permission('page:attendance-detail')
    OR public.current_user_has_permission('page:attendance-summary')
  )
  WITH CHECK (
    public.current_user_has_permission('page:attendance-detail')
    OR public.current_user_has_permission('page:attendance-summary')
  );

-- ========== employees ==========
-- page:employee-list 只放开 SELECT；INSERT/UPDATE/DELETE 仍限 admin
DROP POLICY IF EXISTS "employees permission select" ON public.employees;
CREATE POLICY "employees permission select" ON public.employees
  FOR SELECT TO authenticated
  USING (public.current_user_has_permission('page:employee-list'));

-- ========== job_base_settings ==========
DROP POLICY IF EXISTS "job_base_settings permission rw" ON public.job_base_settings;
CREATE POLICY "job_base_settings permission rw" ON public.job_base_settings
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:job-base-setting'))
  WITH CHECK (public.current_user_has_permission('page:job-base-setting'));

-- ========== labor_protection_data ==========
DROP POLICY IF EXISTS "labor_protection_data permission rw" ON public.labor_protection_data;
CREATE POLICY "labor_protection_data permission rw" ON public.labor_protection_data
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:labor-protection-data'))
  WITH CHECK (public.current_user_has_permission('page:labor-protection-data'));

-- ========== labor_protection_requisitions ==========
DROP POLICY IF EXISTS "labor_protection_requisitions permission rw" ON public.labor_protection_requisitions;
CREATE POLICY "labor_protection_requisitions permission rw" ON public.labor_protection_requisitions
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:labor-protection-requisition'))
  WITH CHECK (public.current_user_has_permission('page:labor-protection-requisition'));

-- ========== machine_equipment_maintenances ==========
DROP POLICY IF EXISTS "machine_equipment_maintenances permission rw" ON public.machine_equipment_maintenances;
CREATE POLICY "machine_equipment_maintenances permission rw" ON public.machine_equipment_maintenances
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:machine-equipment-maintenance'))
  WITH CHECK (public.current_user_has_permission('page:machine-equipment-maintenance'));

-- ========== material_transfers ==========
-- 管理视角：拿到权限即可看/改所有员工的单
DROP POLICY IF EXISTS "material_transfers permission rw" ON public.material_transfers;
CREATE POLICY "material_transfers permission rw" ON public.material_transfers
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:material-transfer'))
  WITH CHECK (public.current_user_has_permission('page:material-transfer'));

-- ========== precision_cutting_transfers ==========
DROP POLICY IF EXISTS "precision_cutting_transfers permission rw" ON public.precision_cutting_transfers;
CREATE POLICY "precision_cutting_transfers permission rw" ON public.precision_cutting_transfers
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:precision-cutting-transfer'))
  WITH CHECK (public.current_user_has_permission('page:precision-cutting-transfer'));

-- ========== precision_finishing_cuttings ==========
DROP POLICY IF EXISTS "precision_finishing_cuttings permission rw" ON public.precision_finishing_cuttings;
CREATE POLICY "precision_finishing_cuttings permission rw" ON public.precision_finishing_cuttings
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:precision-finishing-cutting'))
  WITH CHECK (public.current_user_has_permission('page:precision-finishing-cutting'));

-- ========== production_orders ==========
DROP POLICY IF EXISTS "production_orders permission rw" ON public.production_orders;
CREATE POLICY "production_orders permission rw" ON public.production_orders
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:production-order'))
  WITH CHECK (public.current_user_has_permission('page:production-order'));

-- ========== production_order_items ==========
DROP POLICY IF EXISTS "production_order_items permission rw" ON public.production_order_items;
CREATE POLICY "production_order_items permission rw" ON public.production_order_items
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:production-order'))
  WITH CHECK (public.current_user_has_permission('page:production-order'));

-- ========== tooling_data ==========
DROP POLICY IF EXISTS "tooling_data permission rw" ON public.tooling_data;
CREATE POLICY "tooling_data permission rw" ON public.tooling_data
  FOR ALL TO authenticated
  USING (public.current_user_has_permission('page:tooling-data'))
  WITH CHECK (public.current_user_has_permission('page:tooling-data'));
