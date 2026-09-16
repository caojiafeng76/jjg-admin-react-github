ALTER TABLE villa_lift_cutting_records
  ADD COLUMN IF NOT EXISTS spec text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS operator text NOT NULL DEFAULT '';;
