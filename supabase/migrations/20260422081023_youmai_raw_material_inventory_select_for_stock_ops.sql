
-- 允许拥有入库或出库页面权限的用户 SELECT 库存表（用于下拉选项）
-- 他们不需要完整的库存管理页面权限，只需要能读取选项
DROP POLICY IF EXISTS "Youmai raw material inventory select for stock ops" ON public.youmai_raw_material_inventory;

CREATE POLICY "Youmai raw material inventory select for stock ops"
  ON public.youmai_raw_material_inventory
  FOR SELECT
  TO authenticated
  USING (
    public.current_user_has_permission('page:youmai-raw-material-stock-in')
    OR public.current_user_has_permission('page:youmai-raw-material-stock-out')
  );
;
