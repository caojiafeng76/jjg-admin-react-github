CREATE TABLE villa_lift_cutting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES villa_lift_orders(id) ON DELETE CASCADE,
  model TEXT NOT NULL DEFAULT '',
  cut_quantity INTEGER NOT NULL DEFAULT 0 CHECK (cut_quantity >= 0),
  raw_scrap_quantity INTEGER NOT NULL DEFAULT 0 CHECK (raw_scrap_quantity >= 0),
  process_scrap_quantity INTEGER NOT NULL DEFAULT 0 CHECK (process_scrap_quantity >= 0),
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX villa_lift_cutting_records_order_id_idx ON villa_lift_cutting_records(order_id);

CREATE TRIGGER set_updated_at_villa_lift_cutting_records
  BEFORE UPDATE ON villa_lift_cutting_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE villa_lift_cutting_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_authenticated_all" ON villa_lift_cutting_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);;
