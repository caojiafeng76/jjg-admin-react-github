ALTER TABLE villa_lift_cutting_records
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';;
