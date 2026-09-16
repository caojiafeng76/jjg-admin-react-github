-- 1. 添加 machine_equipment_id 列（FK → machine_equipment_maintenances，可为空）
ALTER TABLE production_order_items
  ADD COLUMN IF NOT EXISTS machine_equipment_id uuid NULL
    REFERENCES machine_equipment_maintenances(id) ON DELETE SET NULL;

-- 2. 添加 theoretical_seconds 列（理论加工时间快照，秒，默认 0）
ALTER TABLE production_order_items
  ADD COLUMN IF NOT EXISTS theoretical_seconds float8 NOT NULL DEFAULT 0;;
