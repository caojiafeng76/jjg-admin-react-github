CREATE OR REPLACE FUNCTION public.sync_production_order_items_with_process_standard() RETURNS TRIGGER AS $$ BEGIN IF NEW.standard_seconds IS NOT DISTINCT
FROM OLD.standard_seconds
  AND NEW.model IS NOT DISTINCT
FROM OLD.model
  AND NEW.operation IS NOT DISTINCT
FROM OLD.operation THEN RETURN NEW;
END IF;
UPDATE public.production_order_items AS poi
SET standard_seconds = NEW.standard_seconds
WHERE poi.product_model = OLD.model
  AND poi.operation = OLD.operation;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS sync_production_order_items_with_process_standard ON public.process_standards;
CREATE TRIGGER sync_production_order_items_with_process_standard
AFTER
UPDATE ON public.process_standards FOR EACH ROW EXECUTE FUNCTION public.sync_production_order_items_with_process_standard();
UPDATE public.production_order_items AS poi
SET standard_seconds = ps.standard_seconds
FROM public.process_standards AS ps
WHERE poi.product_model = ps.model
  AND poi.operation = ps.operation
  AND poi.standard_seconds IS DISTINCT
FROM ps.standard_seconds;