-- 添加索引优化查询
CREATE INDEX idx_production_orders_date ON production_orders(order_date);
CREATE INDEX idx_production_orders_employee ON production_orders(employee_id);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_order_items_order ON production_order_items(order_id);
CREATE INDEX idx_production_order_items_project ON production_order_items(project_no);
CREATE INDEX idx_production_order_items_operation ON production_order_items(operation);
CREATE INDEX idx_production_order_items_model ON production_order_items(product_model);;
