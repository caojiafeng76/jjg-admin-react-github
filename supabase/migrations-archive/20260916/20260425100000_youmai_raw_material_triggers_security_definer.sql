-- ============================================================
-- 修复：优迈原料 入/出库 trigger 函数改为 SECURITY DEFINER
-- ============================================================
-- 背景：
--   handle_youmai_raw_material_stock_in/out_insert/delete 这 4 个 trigger
--   函数会在 INSERT/DELETE 入库或出库记录时 UPDATE youmai_raw_material_inventory
--   表的 quantity 字段，作为系统副作用维护库存。
--
--   原版函数没有 SECURITY DEFINER，以调用用户身份执行；当用户只有
--   page:youmai-raw-material-stock-in / stock-out 权限但没有
--   page:youmai-raw-material-inventory 权限时（比如 precision_cutting_admin
--   被授予 stock-out 后），inventory 表的 RLS（FOR ALL）会把 UPDATE 拦下，
--   返回 0 行，触发"原料库存不足，无法出库"假性报错。
--
-- 修复：
--   将 4 个 trigger 函数改为 SECURITY DEFINER + SET search_path = public，
--   让库存增减绕过 RLS。inventory 表的直接编辑入口仍由 page:youmai-raw-
--   material-inventory 权限保护，不会被本变更绕过。
-- ============================================================
-- 入库 INSERT：增加库存
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_in_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = quantity + NEW.quantity
WHERE id = NEW.inventory_id;
RETURN NEW;
END;
$$;
-- 入库 DELETE：回滚库存
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_in_delete() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = GREATEST(0, quantity - OLD.quantity)
WHERE id = OLD.inventory_id;
RETURN OLD;
END;
$$;
-- 出库 INSERT：减少库存（库存不足则报错）
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_out_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = quantity - NEW.quantity
WHERE id = NEW.inventory_id
  AND quantity >= NEW.quantity;
IF NOT FOUND THEN RAISE EXCEPTION '原料库存不足，无法出库';
END IF;
RETURN NEW;
END;
$$;
-- 出库 DELETE：回滚库存
CREATE OR REPLACE FUNCTION public.handle_youmai_raw_material_stock_out_delete() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN
UPDATE public.youmai_raw_material_inventory
SET quantity = quantity + OLD.quantity
WHERE id = OLD.inventory_id;
RETURN OLD;
END;
$$;