-- 为 sales_orders 表添加行备注字段
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS row_remark text;