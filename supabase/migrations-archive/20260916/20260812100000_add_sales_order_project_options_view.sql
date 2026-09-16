-- 销售订单项目号选项视图：服务端一次扫描去重，替代 4 处前端 while 分页全表扫描
-- （apiProcessStandards / apiExtrusionProductions / apiQualityIssueRecords /
--   apiQualityReworkRepair 的 get*ProjectNos / get*OrderOptions）
-- sales_orders.project_no 已有 partial unique 索引（20260716000000），
-- 因此每个 project_no 在视图中天然只有一行，无需 DISTINCT。

create or replace view public.v_sales_order_project_options as
select
  project_no,
  product_model,
  length_mm,
  material_code,
  customer,
  customer_model,
  weight_per_meter_kg,
  order_quantity,
  created_at,
  status
from public.sales_orders
where nullif(btrim(project_no), '') is not null;

grant select on public.v_sales_order_project_options to anon, authenticated;
