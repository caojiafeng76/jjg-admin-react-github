-- 性能优化清单 #7：为高频组合查询补充复合索引
-- 依据查询模式：
-- 1. production_order_items: 生产工单列表 inner join (item_filters) 过滤 data_category/product_model/customer_model
-- 2. production_orders: 列表按 order_date 范围过滤 + created_at DESC/order_date DESC 排序
-- 3. sales_orders: 车间订单/排产按 order_date 范围 + project_no 组合过滤
-- 4. material_transfers: 列表按 project_no 过滤 + created_at DESC 排序

CREATE INDEX IF NOT EXISTS idx_production_order_items_model_customer_category
  ON public.production_order_items (product_model, customer_model, data_category);

CREATE INDEX IF NOT EXISTS idx_production_orders_order_date_created_at
  ON public.production_orders (order_date, created_at);

CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date_project_no
  ON public.sales_orders (order_date, project_no);

CREATE INDEX IF NOT EXISTS idx_material_transfers_project_no_created_at
  ON public.material_transfers (project_no, created_at);
