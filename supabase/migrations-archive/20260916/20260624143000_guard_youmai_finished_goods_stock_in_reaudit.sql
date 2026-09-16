create or replace function public.apply_youmai_finished_goods_stock_in_reversal(
    target_product_data_id uuid,
    target_stock_in_quantity numeric
  ) returns void language plpgsql as $$ begin
update public.youmai_finished_goods_inventory
set current_stock = current_stock - target_stock_in_quantity
where product_data_id = target_product_data_id
  and current_stock >= target_stock_in_quantity;
if not found then raise exception '优迈成品库存不足，无法反审入库；请先反审/删除后续出库或补足库存后再操作';
end if;
end;
$$;

create or replace function public.handle_youmai_finished_goods_stock_in_inventory_sync() returns trigger language plpgsql as $$ begin if tg_op = 'INSERT' then perform public.ensure_youmai_finished_goods_inventory_row(
    new.product_data_id,
    new.material_code,
    new.material_name,
    new.model,
    new.specification,
    new.specific_gravity
  );
if new.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + new.stock_in_quantity
where product_data_id = new.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_in(new.product_data_id);
return new;
end if;
if tg_op = 'UPDATE' then if old.product_data_id <> new.product_data_id then perform public.ensure_youmai_finished_goods_inventory_row(
  new.product_data_id,
  new.material_code,
  new.material_name,
  new.model,
  new.specification,
  new.specific_gravity
);
if old.status = '已审核' then perform public.apply_youmai_finished_goods_stock_in_reversal(
  old.product_data_id,
  old.stock_in_quantity
);
end if;
if new.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + new.stock_in_quantity
where product_data_id = new.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_in(old.product_data_id);
perform public.refresh_youmai_inventory_pending_stock_in(new.product_data_id);
return new;
end if;
perform public.ensure_youmai_finished_goods_inventory_row(
  new.product_data_id,
  new.material_code,
  new.material_name,
  new.model,
  new.specification,
  new.specific_gravity
);
if old.status = '已审核'
and new.status = '已审核' then if new.stock_in_quantity > old.stock_in_quantity then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + (new.stock_in_quantity - old.stock_in_quantity)
where product_data_id = new.product_data_id;
elsif new.stock_in_quantity < old.stock_in_quantity then perform public.apply_youmai_finished_goods_stock_in_reversal(
  new.product_data_id,
  old.stock_in_quantity - new.stock_in_quantity
);
end if;
elsif old.status = '已审核'
and new.status <> '已审核' then perform public.apply_youmai_finished_goods_stock_in_reversal(
  new.product_data_id,
  old.stock_in_quantity
);
elsif old.status <> '已审核'
and new.status = '已审核' then
update public.youmai_finished_goods_inventory
set current_stock = current_stock + new.stock_in_quantity
where product_data_id = new.product_data_id;
end if;
perform public.refresh_youmai_inventory_pending_stock_in(new.product_data_id);
return new;
end if;
if old.status = '已审核' then perform public.apply_youmai_finished_goods_stock_in_reversal(
  old.product_data_id,
  old.stock_in_quantity
);
end if;
perform public.refresh_youmai_inventory_pending_stock_in(old.product_data_id);
return old;
end;
$$;
