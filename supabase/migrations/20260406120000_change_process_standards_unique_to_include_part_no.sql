-- 将 process_standards 的唯一约束从 (model, operation) 改为 (model, operation, part_no)
-- 同时删除依赖旧约束的 production_order_items 外键（改由应用层匹配逻辑维护）

-- 1. 删除 production_order_items 对 process_standards 的外键约束
alter table public.production_order_items
  drop constraint if exists production_order_items_product_model_operation_fkey;

-- 2. 删除旧的 (model, operation) 唯一约束
alter table public.process_standards
  drop constraint if exists process_standards_model_operation_key;

-- 3. 添加新的 (model, operation, part_no) 唯一约束
--    NULLS NOT DISTINCT 使 NULL part_no 也参与唯一判断（两条 null part_no + 相同 model+operation 会冲突）
alter table public.process_standards
  add constraint process_standards_model_operation_part_no_key
  unique nulls not distinct (model, operation, part_no);
