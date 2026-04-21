-- RBAC 权限系统 - Phase 0
-- 创建 permissions / role_permissions / user_permission_overrides 三张表
-- RLS 策略、get_my_permissions() 函数、全量种子数据、auto_grant_to_admin trigger
--
-- 依赖：
--   20260321010200_add_employee_auth_fields_and_bootstrap_admin.sql (is_admin())
--   20260321010300_enable_strict_employee_scoped_rls.sql (current_employee_id())
-- ============================================================
-- 1. permissions 表：权限清单注册表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  scope text NOT NULL CHECK (scope IN ('nav', 'page', 'feature', 'field')),
  module text NOT NULL,
  surface text NOT NULL DEFAULT 'pc' CHECK (surface IN ('pc', 'mobile', 'both')),
  label text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.permissions IS 'RBAC 权限清单，由代码注册表 (permissionRegistry.ts) 自动 upsert，前端不允许直接 INSERT。';
-- ============================================================
-- 2. role_permissions 表：角色-权限分配
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_id)
);
COMMENT ON TABLE public.role_permissions IS '角色-权限分配关系，每条记录表示某角色被授予某权限。';
-- ============================================================
-- 3. user_permission_overrides 表：用户级权限覆盖
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, permission_id)
);
COMMENT ON TABLE public.user_permission_overrides IS '用户级权限覆盖：enabled=true 授予超出角色的权限，enabled=false 收回角色默认权限。';
-- ============================================================
-- 4. RLS - permissions 表
-- 所有已认证用户可 SELECT，禁止前端直接 INSERT/UPDATE/DELETE
-- ============================================================
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions authenticated select" ON public.permissions;
CREATE POLICY "permissions authenticated select" ON public.permissions FOR
SELECT TO authenticated USING (true);
-- INSERT/UPDATE/DELETE 仅通过 SECURITY DEFINER 函数或 service_role 完成
-- ============================================================
-- 5. RLS - role_permissions 表
-- admin 可全操作，所有已认证用户可 SELECT
-- ============================================================
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_permissions admin insert" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions admin update" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions admin delete" ON public.role_permissions;
DROP POLICY IF EXISTS "role_permissions authenticated select" ON public.role_permissions;
CREATE POLICY "role_permissions admin insert" ON public.role_permissions FOR
INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "role_permissions admin update" ON public.role_permissions FOR
UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "role_permissions admin delete" ON public.role_permissions FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "role_permissions authenticated select" ON public.role_permissions FOR
SELECT TO authenticated USING (true);
-- ============================================================
-- 6. RLS - user_permission_overrides 表
-- admin 可全操作，用户可 SELECT 自己的记录
-- ============================================================
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_overrides admin insert" ON public.user_permission_overrides;
DROP POLICY IF EXISTS "user_overrides admin update" ON public.user_permission_overrides;
DROP POLICY IF EXISTS "user_overrides admin delete" ON public.user_permission_overrides;
DROP POLICY IF EXISTS "user_overrides self select" ON public.user_permission_overrides;
CREATE POLICY "user_overrides admin insert" ON public.user_permission_overrides FOR
INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "user_overrides admin update" ON public.user_permission_overrides FOR
UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "user_overrides admin delete" ON public.user_permission_overrides FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "user_overrides self select" ON public.user_permission_overrides FOR
SELECT TO authenticated USING (
    employee_id = public.current_employee_id()
    OR public.is_admin()
  );
-- ============================================================
-- 7. get_my_permissions() 函数
-- 合并 role_permissions + user_permission_overrides，用户覆盖优先
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_permissions() RETURNS TABLE(key text, enabled boolean) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE v_employee_id uuid;
v_role text;
BEGIN
SELECT e.id,
  e.role INTO v_employee_id,
  v_role
FROM public.employees e
WHERE e.auth_user_id = auth.uid()
  AND e.is_active = true
LIMIT 1;
IF v_employee_id IS NULL THEN RETURN;
END IF;
RETURN QUERY
SELECT p.key,
  -- user_permission_overrides 优先；无覆盖时角色权限默认 enabled=true
  COALESCE(upo.enabled, true) AS enabled
FROM public.permissions p
  LEFT JOIN public.role_permissions rp ON rp.permission_id = p.id
  AND rp.role = v_role
  LEFT JOIN public.user_permission_overrides upo ON upo.permission_id = p.id
  AND upo.employee_id = v_employee_id
WHERE rp.id IS NOT NULL
  OR upo.id IS NOT NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_permissions() TO authenticated;
-- ============================================================
-- 8. 种子数据：permissions 全量权限清单
-- 与 src/config/permissionRegistry.ts 中的 PERMISSION_REGISTRY 保持同步
-- 变更时同步更新 permissionRegistry.ts
-- ============================================================
INSERT INTO public.permissions (key, scope, module, surface, label)
VALUES -- PC 端导航（nav, surface=pc）
  (
    'nav:syney',
    'nav',
    'syney',
    'pc',
    '西尼菜单分组'
  ),
  (
    'nav:workshop-order-list',
    'nav',
    'workshop-order-list',
    'pc',
    '订单管理菜单'
  ),
  (
    'nav:production-scheduling',
    'nav',
    'production-scheduling',
    'pc',
    '排产计划菜单'
  ),
  (
    'nav:standard-time-list',
    'nav',
    'standard-time-list',
    'pc',
    '成本核算菜单'
  ),
  (
    'nav:workshop-basic',
    'nav',
    'workshop-basic',
    'pc',
    '基础资料菜单'
  ),
  (
    'nav:reports',
    'nav',
    'reports',
    'pc',
    '报表菜单'
  ),
  (
    'nav:precision-cutting',
    'nav',
    'precision-cutting',
    'pc',
    '精切菜单分组'
  ),
  (
    'nav:consumables',
    'nav',
    'consumables',
    'pc',
    '刀具菜单分组'
  ),
  (
    'nav:labor-protection',
    'nav',
    'labor-protection',
    'pc',
    '劳保菜单分组'
  ),
  (
    'nav:youmai',
    'nav',
    'youmai',
    'pc',
    '优迈菜单分组'
  ),
  (
    'nav:attendance',
    'nav',
    'attendance',
    'pc',
    '考勤菜单分组'
  ),
  (
    'nav:access-management',
    'nav',
    'access-management',
    'pc',
    '权限管理菜单'
  ),
  -- 移动端导航（nav, surface=mobile）
  (
    'nav:mobile-workspace',
    'nav',
    'mobile-workspace',
    'mobile',
    '员工工作台'
  ),
  (
    'nav:mobile-daily-report',
    'nav',
    'mobile-daily-report',
    'mobile',
    '我的日报 Tab'
  ),
  (
    'nav:mobile-scan',
    'nav',
    'mobile-scan',
    'mobile',
    '扫码中心入口'
  ),
  -- PC 端页面（page, surface=pc）
  (
    'page:dashboard',
    'page',
    'dashboard',
    'pc',
    '首页'
  ),
  (
    'page:syney-po-list',
    'page',
    'syney',
    'pc',
    '西尼订单列表'
  ),
  (
    'page:syney-store-report-list',
    'page',
    'syney',
    'pc',
    '西尼入库单列表'
  ),
  (
    'page:syney-safe-part-setting',
    'page',
    'syney',
    'pc',
    '件号配置'
  ),
  (
    'page:syney-spec-list',
    'page',
    'syney',
    'pc',
    '踏板规格列表'
  ),
  (
    'page:syney-setting',
    'page',
    'syney',
    'pc',
    '西尼编号设置'
  ),
  (
    'page:workshop-order-production',
    'page',
    'workshop-order-list',
    'pc',
    '订单管理-生产中'
  ),
  (
    'page:workshop-order-closed',
    'page',
    'workshop-order-list',
    'pc',
    '订单管理-已结案'
  ),
  (
    'page:production-scheduling',
    'page',
    'production-scheduling',
    'pc',
    '排产计划'
  ),
  (
    'page:standard-time-list',
    'page',
    'standard-time-list',
    'pc',
    '成本核算'
  ),
  (
    'page:employee-list',
    'page',
    'employee-list',
    'pc',
    '员工管理'
  ),
  (
    'page:job-base-setting',
    'page',
    'job-base-setting',
    'pc',
    '岗位基础数值设定'
  ),
  (
    'page:machine-equipment-maintenance',
    'page',
    'machine-equipment',
    'pc',
    '机器设备维护'
  ),
  (
    'page:machine-runtime',
    'page',
    'machine-runtime',
    'pc',
    '设备运行时间'
  ),
  (
    'page:precision-cutting-transfer',
    'page',
    'precision-cutting',
    'pc',
    '精切转移单'
  ),
  (
    'page:tooling-data',
    'page',
    'consumables',
    'pc',
    '刀具资料'
  ),
  (
    'page:labor-protection-data',
    'page',
    'labor-protection',
    'pc',
    '劳保资料'
  ),
  (
    'page:labor-protection-requisition',
    'page',
    'labor-protection',
    'pc',
    '劳保领料单'
  ),
  (
    'page:youmai-product-data',
    'page',
    'youmai',
    'pc',
    '优迈货品资料'
  ),
  (
    'page:youmai-finished-goods-inventory',
    'page',
    'youmai',
    'pc',
    '优迈成品库存'
  ),
  (
    'page:youmai-finished-goods-stock-in',
    'page',
    'youmai',
    'pc',
    '优迈成品入库'
  ),
  (
    'page:youmai-finished-goods-stock-out',
    'page',
    'youmai',
    'pc',
    '优迈成品出库'
  ),
  (
    'page:attendance-detail',
    'page',
    'attendance',
    'pc',
    '考勤明细'
  ),
  (
    'page:attendance-summary',
    'page',
    'attendance',
    'pc',
    '考勤统计'
  ),
  (
    'page:access-management',
    'page',
    'access-management',
    'pc',
    '权限管理'
  ),
  -- PC+移动端共享页面（surface=both）：admin 和 employee/team_leader 均可访问
  (
    'page:workshop-order-qr-detail',
    'page',
    'workshop-order-list',
    'both',
    '订单二维码详情'
  ),
  (
    'page:material-transfer',
    'page',
    'material-transfer',
    'both',
    '物料转移单'
  ),
  (
    'page:production-order',
    'page',
    'production-order',
    'both',
    '生产工单'
  ),
  (
    'page:production-daily-report',
    'page',
    'production-daily-report',
    'both',
    '生产日报表'
  ),
  (
    'page:precision-finishing-cutting',
    'page',
    'precision-finishing-cutting',
    'both',
    '精加工切割单'
  ),
  -- 移动端页面（page, surface=mobile）
  (
    'page:mobile-production-order',
    'page',
    'mobile-production-order',
    'mobile',
    '移动端：我的工单'
  ),
  (
    'page:mobile-production-daily-report',
    'page',
    'mobile-production-daily-report',
    'mobile',
    '移动端：我的日报'
  ),
  (
    'page:mobile-scan-hub',
    'page',
    'mobile-scan',
    'mobile',
    '移动端：扫码中心'
  ),
  (
    'page:mobile-scan-production-order',
    'page',
    'mobile-scan',
    'mobile',
    '移动端：扫码添加工单'
  ),
  (
    'page:mobile-scan-material-transfer',
    'page',
    'mobile-scan',
    'mobile',
    '移动端：物料转移扫码'
  ),
  (
    'page:mobile-scan-precision-finishing',
    'page',
    'mobile-scan',
    'mobile',
    '移动端：精加工切割扫码'
  ),
  (
    'page:mobile-change-password',
    'page',
    'mobile-workspace',
    'mobile',
    '移动端：修改密码'
  ),
  -- PC 端功能权限（feature, surface=pc）
  (
    'feature:syney-po-list.create',
    'feature',
    'syney-po-list',
    'pc',
    '西尼订单-新建'
  ),
  (
    'feature:syney-po-list.edit',
    'feature',
    'syney-po-list',
    'pc',
    '西尼订单-编辑'
  ),
  (
    'feature:syney-po-list.delete',
    'feature',
    'syney-po-list',
    'pc',
    '西尼订单-删除'
  ),
  (
    'feature:syney-po-list.export',
    'feature',
    'syney-po-list',
    'pc',
    '西尼订单-导出'
  ),
  (
    'feature:employee-list.create',
    'feature',
    'employee-list',
    'pc',
    '员工管理-新建'
  ),
  (
    'feature:employee-list.edit',
    'feature',
    'employee-list',
    'pc',
    '员工管理-编辑'
  ),
  (
    'feature:employee-list.edit-role',
    'feature',
    'employee-list',
    'pc',
    '员工管理-修改角色'
  ),
  (
    'feature:employee-list.reset-password',
    'feature',
    'employee-list',
    'pc',
    '员工管理-重置密码'
  ),
  (
    'feature:employee-list.delete',
    'feature',
    'employee-list',
    'pc',
    '员工管理-删除'
  ),
  (
    'feature:material-transfer.audit',
    'feature',
    'material-transfer',
    'pc',
    '物料转移单-审核'
  ),
  (
    'feature:material-transfer.delete',
    'feature',
    'material-transfer',
    'pc',
    '物料转移单-删除'
  ),
  (
    'feature:production-order.close',
    'feature',
    'production-order',
    'pc',
    '生产工单-结单'
  ),
  (
    'feature:production-order.delete',
    'feature',
    'production-order',
    'pc',
    '生产工单-删除'
  ),
  -- PC+移动端共享功能（feature, surface=both）
  (
    'feature:material-transfer.create',
    'feature',
    'material-transfer',
    'both',
    '物料转移单-新建'
  ),
  (
    'feature:production-order.create',
    'feature',
    'production-order',
    'both',
    '生产工单-新建'
  ),
  -- 移动端功能（feature, surface=mobile）
  (
    'feature:mobile-production-order.create',
    'feature',
    'mobile-production-order',
    'mobile',
    '移动端工单-新建'
  ),
  (
    'feature:mobile-production-order.edit',
    'feature',
    'mobile-production-order',
    'mobile',
    '移动端工单-编辑'
  ) ON CONFLICT (key) DO NOTHING;
-- ============================================================
-- 9. 种子数据：role_permissions 各角色初始权限绑定
-- 确保 Phase 4 移除旧硬编码后所有角色功能开箱即用
-- ============================================================
-- admin：绑定所有权限（通过 trigger 也会自动获得未来新增权限）
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin',
  id
FROM public.permissions ON CONFLICT (role, permission_id) DO NOTHING;
-- precision_cutting_admin：订单管理 + 精切转移单（严格对应 router.tsx 中 allow 配置）
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'precision_cutting_admin',
  id
FROM public.permissions
WHERE key IN (
    'nav:workshop-order-list',
    'nav:precision-cutting',
    'page:workshop-order-production',
    'page:workshop-order-closed',
    'page:workshop-order-qr-detail',
    'page:precision-cutting-transfer'
  ) ON CONFLICT (role, permission_id) DO NOTHING;
-- team_leader：mobile + both 页面/导航/功能，plus PC 端成本核算
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'team_leader',
  id
FROM public.permissions
WHERE (
    scope IN ('nav', 'page', 'feature')
    AND surface IN ('mobile', 'both')
  )
  OR key IN (
    'nav:standard-time-list',
    'page:standard-time-list'
  ) ON CONFLICT (role, permission_id) DO NOTHING;
-- employee：mobile + both 页面/导航/功能
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'employee',
  id
FROM public.permissions
WHERE scope IN ('nav', 'page', 'feature')
  AND surface IN ('mobile', 'both') ON CONFLICT (role, permission_id) DO NOTHING;
-- ============================================================
-- 10. DB trigger：新权限 INSERT 时自动授予 admin 角色
-- 确保未来新增模块的权限无需手动配置即可对 admin 生效
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_grant_permission_to_admin() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
INSERT INTO public.role_permissions (role, permission_id)
VALUES ('admin', NEW.id) ON CONFLICT (role, permission_id) DO NOTHING;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS auto_grant_to_admin ON public.permissions;
CREATE TRIGGER auto_grant_to_admin
AFTER
INSERT ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.auto_grant_permission_to_admin();