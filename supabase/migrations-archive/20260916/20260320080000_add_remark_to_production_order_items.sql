-- Add remark column to production_order_items table
ALTER TABLE production_order_items ADD COLUMN remark TEXT;

-- Update the comment for the column
COMMENT ON COLUMN production_order_items.remark IS '工序明细备注信息';

-- Update the database.types.ts file (this is a manual step for the application)
-- Note: In a real project, you would regenerate types using Supabase CLI:
-- supabase gen types typescript --project-id your-project-id > src/services/database.types.ts