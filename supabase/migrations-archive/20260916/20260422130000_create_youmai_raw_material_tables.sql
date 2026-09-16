-- ============================================================
-- 优迈原料管理三张表
--   youmai_raw_material_inventory  原料库存（型号+规格唯一）
--   youmai_raw_material_stock_in   原料入库（即时生效，触发库存增加）
--   youmai_raw_material_stock_out  原料出库（即时生效，触发库存减少）
-- ============================================================
-- ============================================================
-- 1. 原料库存表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.youmai_raw_material_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  specification text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT youmai_raw_material_inventory_model_not_blank CHECK (btrim(model) <> ''),
  CONSTRAINT youmai_raw_material_inventory_specification_not_blank CHECK (btrim(specification) <> ''),
  CONSTRAINT youmai_raw_material_inventory_quantity_non_negative CHECK (quantity >= 0),
  CONSTRAINT youmai_raw_material_inventory_model_spec_unique UNIQUE (model, specification)
);
COMMENT ON TABLE public.youmai_raw_material_inventory IS '优迈原料库存，按（型号+规格）唯一';
COMMENT ON COLUMN public.youmai_raw_material_inventory.model IS '型号';
COMMENT ON COLUMN public.youmai_raw_material_inventory.specification IS '规格';
COMMENT ON COLUMN public.youmai_raw_material_inventory.quantity IS '当前库存数量';
CREATE INDEX IF NOT EXISTS idx_youmai_raw_material_inventory_model_spec ON public.youmai_raw_material_inventory (model, specification);
CREATE INDEX IF NOT EXISTS idx_youmai_raw_material_inventory_updated_at_desc ON public.youmai_raw_material_inventory (updated_at DESC);
DROP TRIGGER IF EXISTS update_youmai_raw_material_inventory_updated_at ON public.youmai_raw_material_inventory;
CREATE TRIGGER update_youmai_raw_material_inventory_updated_at BEFORE
UPDATE ON public.youmai_raw_material_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.youmai_raw_material_inventory ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- 2. 原料入库表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.youmai_raw_material_stock_in (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.youmai_raw_material_inventory(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  model text NOT NULL,
  specification text NOT NULL,
  quantity integer NOT NULL,
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT youmai_raw_material_stock_in_model_not_blank CHECK (btrim(model) <> ''),
  CONSTRAINT youmai_raw_material_stock_in_specification_not_blank CHECK (btrim(specification) <> ''),
  CONSTRAINT youmai_raw_material_stock_in_quantity_positive CHECK (quantity > 0)
);
COMMENT ON TABLE public.youmai_raw_material_stock_in IS '优迈原料入库记录，新增时即时增加库存';
COMMENT ON COLUMN public.youmai_raw_material_stock_in.inventory_id IS '关联原料库存行';
COMMENT ON COLUMN public.youmai_raw_material_stock_in.model IS '型号快照';
COMMENT ON COLUMN public.youmai_raw_material_stock_in.specification IS '规格快照';
COMMENT ON COLUMN public.youmai_raw_material_stock_in.quantity IS '入库数量';
CREATE INDEX IF NOT EXISTS idx_youmai_raw_material_stock_in_inventory_id ON public.youmai_raw_material_stock_in (inventory_id);
CREATE INDEX IF NOT EXISTS idx_youmai_raw_material_stock_in_created_at_desc ON public.youmai_raw_material_stock_in (created_at DESC);
DROP TRIGGER IF EXISTS update_youmai_raw_material_stock_in_updated_at ON public.youmai_raw_material_stock_in;
CREATE TRIGGER update_youmai_raw_material_stock_in_updated_at BEFORE
UPDATE ON public.youmai_raw_material_stock_in FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.youmai_raw_material_stock_in ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- 3. 原料出库表
-- ============================================================
CREATE TABLE IF NOT EXISTS public.youmai_raw_material_stock_out (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.youmai_raw_material_inventory(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  model text NOT NULL,
  specification text NOT NULL,
  quantity integer NOT NULL,
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT youmai_raw_material_stock_out_model_not_blank CHECK (btrim(model) <> ''),
  CONSTRAINT youmai_raw_material_stock_out_specification_not_blank CHECK (btrim(specification) <> ''),
  CONSTRAINT youmai_raw_material_stock_out_quantity_positive CHECK (quantity > 0)
);
COMMENT ON TABLE public.youmai_raw_material_stock_out IS '优迈原料出库记录，新增时即时减少库存';
COMMENT ON COLUMN public.youmai_raw_material_stock_out.inventory_id IS '关联原料库存行';
COMMENT ON COLUMN public.youmai_raw_material_stock_out.model IS '型号快照';
COMMENT ON COLUMN public.youmai_raw_material_stock_out.specification IS '规格快照';
COMMENT ON COLUMN public.youmai_raw_material_stock_out.quantity IS '出库数量';
CREATE INDEX IF NOT EXISTS idx_youmai_raw_material_stock_out_inventory_id ON public.youmai_raw_material_stock_out (inventory_id);
CREATE INDEX IF NOT EXISTS idx_youmai_raw_material_stock_out_created_at_desc ON public.youmai_raw_material_stock_out (created_at DESC);
DROP TRIGGER IF EXISTS update_youmai_raw_material_stock_out_updated_at ON public.youmai_raw_material_stock_out;
CREATE TRIGGER update_youmai_raw_material_stock_out_updated_at BEFORE
UPDATE ON public.youmai_raw_material_stock_out FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.youmai_raw_material_stock_out ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- 4. 入库 trigger：INSERT 时增加库存
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_in_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = quantity + NEW.quantity
WHERE id = NEW.inventory_id;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS youmai_raw_material_stock_in_apply ON public.youmai_raw_material_stock_in;
CREATE TRIGGER youmai_raw_material_stock_in_apply
AFTER
INSERT ON public.youmai_raw_material_stock_in FOR EACH ROW EXECUTE FUNCTION public.handle_youmai_raw_material_stock_in_insert();
-- 入库删除时回滚库存
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_in_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = GREATEST(0, quantity - OLD.quantity)
WHERE id = OLD.inventory_id;
RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS youmai_raw_material_stock_in_revert ON public.youmai_raw_material_stock_in;
CREATE TRIGGER youmai_raw_material_stock_in_revert
AFTER DELETE ON public.youmai_raw_material_stock_in FOR EACH ROW EXECUTE FUNCTION public.handle_youmai_raw_material_stock_in_delete();
-- ============================================================
-- 5. 出库 trigger：INSERT 时减少库存（库存不足则报错）
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_out_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = quantity - NEW.quantity
WHERE id = NEW.inventory_id
  AND quantity >= NEW.quantity;
IF NOT FOUND THEN RAISE EXCEPTION '原料库存不足，无法出库';
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS youmai_raw_material_stock_out_apply ON public.youmai_raw_material_stock_out;
CREATE TRIGGER youmai_raw_material_stock_out_apply
AFTER
INSERT ON public.youmai_raw_material_stock_out FOR EACH ROW EXECUTE FUNCTION public.handle_youmai_raw_material_stock_out_insert();
-- 出库删除时回滚库存
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_out_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = quantity + OLD.quantity
WHERE id = OLD.inventory_id;
RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS youmai_raw_material_stock_out_revert ON public.youmai_raw_material_stock_out;
CREATE TRIGGER youmai_raw_material_stock_out_revert
AFTER DELETE ON public.youmai_raw_material_stock_out FOR EACH ROW EXECUTE FUNCTION public.handle_youmai_raw_material_stock_out_delete();