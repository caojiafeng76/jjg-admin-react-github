CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_in_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.youmai_raw_material_inventory
  SET quantity = quantity + NEW.quantity
  WHERE id = NEW.inventory_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_in_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.youmai_raw_material_inventory
  SET quantity = GREATEST(0, quantity - OLD.quantity)
  WHERE id = OLD.inventory_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_out_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.youmai_raw_material_inventory
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.inventory_id
    AND quantity >= NEW.quantity;
  IF NOT FOUND THEN
    RAISE EXCEPTION '原料库存不足，无法出库';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_out_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.youmai_raw_material_inventory
  SET quantity = quantity + OLD.quantity
  WHERE id = OLD.inventory_id;
  RETURN OLD;
END;
$$;;
