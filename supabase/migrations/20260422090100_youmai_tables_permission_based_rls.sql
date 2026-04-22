-- 让有 page:youmai-* 权限的非 admin 角色也能 CRUD 对应优迈表
-- admin 已被 is_admin() 策略覆盖，这里追加 permission-based 策略
-- youmai_product_data
DROP POLICY IF EXISTS "Youmai product data permission rw" ON public.youmai_product_data;
CREATE POLICY "Youmai product data permission rw" ON public.youmai_product_data FOR ALL TO authenticated USING (
  public.current_user_has_permission('page:youmai-product-data')
) WITH CHECK (
  public.current_user_has_permission('page:youmai-product-data')
);
-- youmai_finished_goods_inventory
DROP POLICY IF EXISTS "Youmai finished goods inventory permission rw" ON public.youmai_finished_goods_inventory;
CREATE POLICY "Youmai finished goods inventory permission rw" ON public.youmai_finished_goods_inventory FOR ALL TO authenticated USING (
  public.current_user_has_permission('page:youmai-finished-goods-inventory')
) WITH CHECK (
  public.current_user_has_permission('page:youmai-finished-goods-inventory')
);
-- youmai_finished_goods_stock_in
DROP POLICY IF EXISTS "Youmai finished goods stock in permission rw" ON public.youmai_finished_goods_stock_in;
CREATE POLICY "Youmai finished goods stock in permission rw" ON public.youmai_finished_goods_stock_in FOR ALL TO authenticated USING (
  public.current_user_has_permission('page:youmai-finished-goods-stock-in')
) WITH CHECK (
  public.current_user_has_permission('page:youmai-finished-goods-stock-in')
);
-- youmai_finished_goods_stock_out
DROP POLICY IF EXISTS "Youmai finished goods stock out permission rw" ON public.youmai_finished_goods_stock_out;
CREATE POLICY "Youmai finished goods stock out permission rw" ON public.youmai_finished_goods_stock_out FOR ALL TO authenticated USING (
  public.current_user_has_permission('page:youmai-finished-goods-stock-out')
) WITH CHECK (
  public.current_user_has_permission('page:youmai-finished-goods-stock-out')
);