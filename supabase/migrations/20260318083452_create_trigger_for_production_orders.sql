-- 创建触发器函数更新生产工单的计算字段
CREATE OR REPLACE FUNCTION update_production_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- 计算合格工时和工时效率
  WITH item_calcs AS (
    SELECT 
      COALESCE(SUM(qualified_quantity * standard_seconds), 0) / 3600.0 +
      COALESCE(SUM(bonus_seconds), 0) / 3600.0 -
      COALESCE(SUM(
        CASE WHEN defect_reason_1 = '加工' THEN defect_quantity_1 * 2 * standard_seconds ELSE 0 END +
        CASE WHEN defect_reason_2 = '加工' THEN defect_quantity_2 * 2 * standard_seconds ELSE 0 END
      ), 0) / 3600.0 AS total_hours
    FROM production_order_items
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  )
  UPDATE production_orders
  SET 
    total_qualified_hours = (SELECT total_hours FROM item_calcs),
    efficiency = CASE 
      WHEN work_hours > 0 THEN (SELECT total_hours FROM item_calcs) / work_hours 
      ELSE 0 
    END,
    updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_production_order_totals
AFTER INSERT OR UPDATE OR DELETE ON production_order_items
FOR EACH ROW EXECUTE FUNCTION update_production_order_totals();;
