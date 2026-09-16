ALTER TABLE villa_lift_orders
  ADD COLUMN IF NOT EXISTS tinting_plan_date date,
  ADD COLUMN IF NOT EXISTS painting_plan_date date,
  ADD COLUMN IF NOT EXISTS film_plan_date date,
  ADD COLUMN IF NOT EXISTS assembly_date date,
  ADD COLUMN IF NOT EXISTS packaging_date date;
;
