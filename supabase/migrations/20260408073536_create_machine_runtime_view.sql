CREATE OR REPLACE VIEW v_machine_runtime_items AS
SELECT
  poi.id,
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
LEFT JOIN machine_equipment_maintenances me ON poi.machine_equipment_id = me.id;;
