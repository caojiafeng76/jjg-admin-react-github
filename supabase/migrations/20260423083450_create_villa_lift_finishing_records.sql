
CREATE TABLE IF NOT EXISTS villa_lift_finishing_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES villa_lift_orders(id) ON DELETE CASCADE,
  model text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  spec text NOT NULL DEFAULT '',
  operation text NOT NULL DEFAULT '',
  operator text NOT NULL DEFAULT '',
  process_quantity integer NOT NULL DEFAULT 0,
  raw_scrap_quantity integer NOT NULL DEFAULT 0,
  process_scrap_quantity integer NOT NULL DEFAULT 0,
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_villa_lift_finishing_records_order_id
  ON villa_lift_finishing_records(order_id);

CREATE INDEX IF NOT EXISTS idx_villa_lift_finishing_records_created_at
  ON villa_lift_finishing_records(created_at DESC);
;
