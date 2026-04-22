-- 允许拥有入库或出库页面权限的用户 SELECT 库存表（用于下拉选项）
-- 背景：拥有 page:youmai-raw-material-stock-in/out 权限的用户需要在
--       新建出入库记录时从下拉菜单选择库存原料，但他们不一定拥有完整的
--       page:youmai-raw-material-inventory 权限，因此需要独立的 SELECT 策略
DROP POLICY IF EXISTS "Youmai raw material inventory select for stock ops" ON public.youmai_raw_material_inventory;
CREATE POLICY "Youmai raw material inventory select for stock ops" ON public.youmai_raw_material_inventory FOR
SELECT TO authenticated USING (
    public.current_user_has_permission('page:youmai-raw-material-stock-in')
    OR public.current_user_has_permission('page:youmai-raw-material-stock-out')
  );