-- Phase 1: 添加机器运行时间相关字段到 production_order_items
-- 1. 添加 machine_equipment_id 列（FK → machine_equipment_maintenances，可为空）
ALTER TABLE production_order_items
ADD COLUMN IF NOT EXISTS machine_equipment_id uuid NULL REFERENCES machine_equipment_maintenances(id) ON DELETE
SET NULL;
-- 2. 添加 theoretical_seconds 列（理论加工时间快照，秒，默认 0）
ALTER TABLE production_order_items
ADD COLUMN IF NOT EXISTS theoretical_seconds float8 NOT NULL DEFAULT 0;
-- 3. 历史数据回填：从 process_standards 补全 theoretical_seconds（best-effort）
--    同时匹配 product_model + operation，优先匹配 length_mm（A 类），其次仅型号（B 类）
UPDATE production_order_items poi
SET theoretical_seconds = ps.theoretical_seconds
FROM process_standards ps
WHERE poi.operation = ps.operation
  AND poi.product_model = ps.model
  AND (
    (
      poi.length_mm IS NOT NULL
      AND ps.length = poi.length_mm
    )
    OR ps.length IS NULL
  )
  AND poi.theoretical_seconds = 0
  AND ps.theoretical_seconds IS NOT NULL
  AND ps.theoretical_seconds > 0;
-- 4. 创建 VIEW v_machine_runtime_items
CREATE OR REPLACE VIEW v_machine_runtime_items AS
SELECT poi.id,
  poi.order_id,
  poi.project_no,
  poi.product_model,
  poi.customer_model,
  poi.length_mm,
  poi.operation,
  poi.incoming_qualified_quantity,
  poi.theoretical_seconds,
  poi.machine_equipment_id,
  poi.incoming_qualified_quantity * poi.theoretical_seconds AS runtime_seconds,
  po.order_date,
  po.employee_id,
  e.name AS operator_name,
  me.unified_device_no,
  me.operation AS device_operation,
  me.machine_name
FROM production_order_items poi
  LEFT JOIN production_orders po ON poi.order_id = po.id
  LEFT JOIN employees e ON po.employee_id = e.id
  LEFT JOIN machine_equipment_maintenances me ON poi.machine_equipment_id = me.id;