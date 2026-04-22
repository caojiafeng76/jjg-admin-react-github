-- ============================================================
-- 优迈原料管理权限注册 + warehouse_admin 角色
-- ============================================================
-- 1. 注册 3 个原料页面权限
INSERT INTO public.permissions (key, scope, module, surface, label)
VALUES (
    'page:youmai-raw-material-inventory',
    'page',
    'youmai',
    'pc',
    '优迈原料库存'
  ),
  (
    'page:youmai-raw-material-stock-in',
    'page',
    'youmai',
    'pc',
    '优迈原料入库'
  ),
  (
    'page:youmai-raw-material-stock-out',
    'page',
    'youmai',
    'pc',
    '优迈原料出库'
  ) ON CONFLICT (key) DO NOTHING;
-- 2. 新建 warehouse_admin 自定义角色
INSERT INTO public.roles (key, label, description, is_builtin)
VALUES (
    'warehouse_admin',
    '仓库管理员',
    '负责原料及成品出入库管理',
    false
  ) ON CONFLICT (key) DO NOTHING;
-- 3. 给 warehouse_admin 角色授予原料相关的 3 个页面权限 + nav:youmai
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'warehouse_admin',
  id
FROM public.permissions
WHERE key IN (
    'nav:youmai',
    'page:youmai-raw-material-inventory',
    'page:youmai-raw-material-stock-in',
    'page:youmai-raw-material-stock-out'
  ) ON CONFLICT (role, permission_id) DO NOTHING;
-- 4. admin 角色通过 auto_grant_to_admin trigger 自动获得新注册的权限，无需手动插入
-- 5. 原料库存 RLS：有 page 权限的用户可 CRUD
DROP POLICY IF EXISTS "Youmai raw material inventory admin all" ON public.youmai_raw_material_inventory;
CREATE POLICY "Youmai raw material inventory admin all" ON public.youmai_raw_material_inventory FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Youmai raw material inventory permission rw" ON public.youmai_raw_material_inventory;
CREATE POLICY "Youmai raw material inventory permission rw" ON public.youmai_raw_material_inventory FOR ALL TO authenticated USING (
  public.current_user_has_permission('page:youmai-raw-material-inventory')
) WITH CHECK (
  public.current_user_has_permission('page:youmai-raw-material-inventory')
);
-- 6. 原料入库 RLS
DROP POLICY IF EXISTS "Youmai raw material stock in admin all" ON public.youmai_raw_material_stock_in;
CREATE POLICY "Youmai raw material stock in admin all" ON public.youmai_raw_material_stock_in FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Youmai raw material stock in permission rw" ON public.youmai_raw_material_stock_in;
CREATE POLICY "Youmai raw material stock in permission rw" ON public.youmai_raw_material_stock_in FOR ALL TO authenticated USING (
  public.current_user_has_permission('page:youmai-raw-material-stock-in')
) WITH CHECK (
  public.current_user_has_permission('page:youmai-raw-material-stock-in')
);
-- 7. 原料出库 RLS
DROP POLICY IF EXISTS "Youmai raw material stock out admin all" ON public.youmai_raw_material_stock_out;
CREATE POLICY "Youmai raw material stock out admin all" ON public.youmai_raw_material_stock_out FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Youmai raw material stock out permission rw" ON public.youmai_raw_material_stock_out;
CREATE POLICY "Youmai raw material stock out permission rw" ON public.youmai_raw_material_stock_out FOR ALL TO authenticated USING (
  public.current_user_has_permission('page:youmai-raw-material-stock-out')
) WITH CHECK (
  public.current_user_has_permission('page:youmai-raw-material-stock-out')
);