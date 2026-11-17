-- 优迈成品出库新增合同号字段（现有数据默认为空字符串），并纳入已审核锁定校验。

alter table public.youmai_finished_goods_stock_out
  add column if not exists contract_no text not null default '';

comment on column public.youmai_finished_goods_stock_out.contract_no is '合同号';

create or replace function public.validate_youmai_finished_goods_stock_out_edit_rules()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
    and old.status = '已审核' then
    if new.product_data_id is distinct from old.product_data_id
      or new.material_code is distinct from old.material_code
      or new.material_name is distinct from old.material_name
      or new.model is distinct from old.model
      or new.specification is distinct from old.specification
      or new.specific_gravity is distinct from old.specific_gravity
      or new.purchase_order_no is distinct from old.purchase_order_no
      or new.purchase_order_line_no is distinct from old.purchase_order_line_no
      or new.contract_no is distinct from old.contract_no
      or new.delivery_date is distinct from old.delivery_date
      or new.stock_out_quantity is distinct from old.stock_out_quantity then
      raise exception '已审核的优迈成品出库仅允许修改备注，审核与反审请使用页面顶部按钮';
    end if;
  end if;
  return new;
end;
$$;
