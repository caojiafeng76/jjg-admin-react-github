create or replace function public.validate_youmai_finished_goods_stock_in_edit_rules() returns trigger language plpgsql as $$ begin if tg_op = 'UPDATE'
  and old.status = '已审核' then if new.product_data_id is distinct
from old.product_data_id
  or new.material_code is distinct
from old.material_code
  or new.material_name is distinct
from old.material_name
  or new.model is distinct
from old.model
  or new.specification is distinct
from old.specification
  or new.specific_gravity is distinct
from old.specific_gravity
  or new.stock_in_quantity is distinct
from old.stock_in_quantity then raise exception '已审核的优迈成品入库仅允许修改备注，审核与反审请使用页面顶部按钮';
end if;
end if;
return new;
end;
$$;
create or replace function public.validate_youmai_finished_goods_stock_out_edit_rules() returns trigger language plpgsql as $$ begin if tg_op = 'UPDATE'
  and old.status = '已审核' then if new.product_data_id is distinct
from old.product_data_id
  or new.material_code is distinct
from old.material_code
  or new.material_name is distinct
from old.material_name
  or new.model is distinct
from old.model
  or new.specification is distinct
from old.specification
  or new.specific_gravity is distinct
from old.specific_gravity
  or new.purchase_order_no is distinct
from old.purchase_order_no
  or new.purchase_order_line_no is distinct
from old.purchase_order_line_no
  or new.delivery_date is distinct
from old.delivery_date
  or new.stock_out_quantity is distinct
from old.stock_out_quantity then raise exception '已审核的优迈成品出库仅允许修改备注，审核与反审请使用页面顶部按钮';
end if;
end if;
return new;
end;
$$;