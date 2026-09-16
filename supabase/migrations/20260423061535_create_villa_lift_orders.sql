
-- ================================================================
-- 别墅梯订单主表
-- ================================================================
CREATE TABLE villa_lift_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date     date,                        -- 排产日期
  delivery_date     date,                        -- 交货日期
  customer          text NOT NULL DEFAULT '',    -- 客户
  project_name      text NOT NULL DEFAULT '',    -- 项目名称
  product_name      text NOT NULL DEFAULT '',    -- 产品名称
  color             text NOT NULL DEFAULT '',    -- 颜色
  quantity          integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),  -- 数量
  remarks           text NOT NULL DEFAULT '',    -- 备注
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- 别墅梯订单明细表
-- ================================================================
CREATE TABLE villa_lift_order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid NOT NULL REFERENCES villa_lift_orders(id) ON DELETE CASCADE,
  model       text NOT NULL DEFAULT '',    -- 型号
  name        text NOT NULL DEFAULT '',    -- 名称
  spec        text NOT NULL DEFAULT '',    -- 规格
  quantity    integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),  -- 数量
  remarks     text NOT NULL DEFAULT '',    -- 备注
  sort_order  integer NOT NULL DEFAULT 0,  -- 排序
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_villa_lift_order_items_order_id ON villa_lift_order_items(order_id);
CREATE INDEX idx_villa_lift_orders_schedule_date ON villa_lift_orders(schedule_date DESC);
CREATE INDEX idx_villa_lift_orders_delivery_date ON villa_lift_orders(delivery_date);

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_villa_lift_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_villa_lift_orders_updated_at
  BEFORE UPDATE ON villa_lift_orders
  FOR EACH ROW EXECUTE FUNCTION update_villa_lift_orders_updated_at();

CREATE OR REPLACE FUNCTION update_villa_lift_order_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_villa_lift_order_items_updated_at
  BEFORE UPDATE ON villa_lift_order_items
  FOR EACH ROW EXECUTE FUNCTION update_villa_lift_order_items_updated_at();

-- ================================================================
-- RLS
-- ================================================================
ALTER TABLE villa_lift_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE villa_lift_order_items ENABLE ROW LEVEL SECURITY;

-- admin 全量 CRUD
CREATE POLICY "admin_full_access_villa_lift_orders"
  ON villa_lift_orders FOR ALL
  TO authenticated
  USING (current_user_has_permission('page:villa-lift-order-list'))
  WITH CHECK (current_user_has_permission('page:villa-lift-order-list'));

CREATE POLICY "admin_full_access_villa_lift_order_items"
  ON villa_lift_order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM villa_lift_orders o
      WHERE o.id = villa_lift_order_items.order_id
        AND current_user_has_permission('page:villa-lift-order-list')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM villa_lift_orders o
      WHERE o.id = villa_lift_order_items.order_id
        AND current_user_has_permission('page:villa-lift-order-list')
    )
  );
;
