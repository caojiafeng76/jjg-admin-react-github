-- 允许拥有订单现状页面权限的用户只读生产工单与工序明细
-- 订单现状岗位列需要读取 production_order_items，再按 process_standards.job_name 汇总。
-- viewer 不拥有 page:production-order，因此不能进入生产工单页面；这里只补 SELECT，写入仍由既有策略和 prevent_viewer_dml 防护限制。
DROP POLICY IF EXISTS "production_orders production_scheduling select" ON public.production_orders;
CREATE POLICY "production_orders production_scheduling select" ON public.production_orders FOR
SELECT TO authenticated USING (
    public.current_user_has_permission('page:production-scheduling')
  );
DROP POLICY IF EXISTS "production_order_items production_scheduling select" ON public.production_order_items;
CREATE POLICY "production_order_items production_scheduling select" ON public.production_order_items FOR
SELECT TO authenticated USING (
    public.current_user_has_permission('page:production-scheduling')
  );