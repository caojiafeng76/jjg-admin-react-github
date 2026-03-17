-- 车间管理重构 - 删除不需要的表
-- 执行顺序: 先删有外键依赖的子表，再删父表

-- 1. 删除产量记录表 (production_records)
-- 此表依赖 production_sheets, sales_orders, workshop_processes, employees
DROP TABLE IF EXISTS production_records;

-- 2. 删除产量单表 (production_sheets)
DROP TABLE IF EXISTS production_sheets;

-- 3. 删除不良原因表 (workshop_defect_reasons)
DROP TABLE IF EXISTS workshop_defect_reasons;

-- 4. 删除工序表 (workshop_processes)
DROP TABLE IF EXISTS workshop_processes;

-- 注意: 以下表保留
-- - employees (员工管理)
-- - sales_orders (订单管理)
