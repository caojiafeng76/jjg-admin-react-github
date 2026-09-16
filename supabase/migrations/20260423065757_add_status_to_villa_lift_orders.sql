
ALTER TABLE villa_lift_orders
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed'));

COMMENT ON COLUMN villa_lift_orders.status IS '订单状态：open=未结案，closed=已结案';
;
