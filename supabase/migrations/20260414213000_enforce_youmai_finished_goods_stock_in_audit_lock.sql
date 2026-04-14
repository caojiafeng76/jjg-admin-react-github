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
  or new.status is distinct
from old.status
  or new.stock_in_quantity is distinct
from old.stock_in_quantity then raise exception '已审核的优迈成品入库仅允许修改备注，不能修改货品、状态或入库数量';
end if;
end if;
return new;
end;
$$;
create or replace function public.prevent_delete_audited_youmai_finished_goods_stock_in() returns trigger language plpgsql as $$ begin if old.status = '已审核' then raise exception '已审核的优迈成品入库不允许删除';
end if;
return old;
end;
$$;
drop trigger if exists validate_youmai_finished_goods_stock_in_edit_rules on public.youmai_finished_goods_stock_in;
create trigger validate_youmai_finished_goods_stock_in_edit_rules before
update on public.youmai_finished_goods_stock_in for each row execute function public.validate_youmai_finished_goods_stock_in_edit_rules();
drop trigger if exists prevent_delete_audited_youmai_finished_goods_stock_in on public.youmai_finished_goods_stock_in;
create trigger prevent_delete_audited_youmai_finished_goods_stock_in before delete on public.youmai_finished_goods_stock_in for each row execute function public.prevent_delete_audited_youmai_finished_goods_stock_in();