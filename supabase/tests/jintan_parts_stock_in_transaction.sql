-- 供 bun run db:query -- --file 手动执行；所有数据变更均在事务末尾回滚。
begin;

do $$
declare
  v_inventory_id uuid;
  v_part_data_id uuid;
  v_initial_quantity integer;
  v_record_id uuid;
  v_blocked boolean;
begin
  select id, part_data_id, quantity
    into v_inventory_id, v_part_data_id, v_initial_quantity
  from public.jintan_parts_inventory
  order by id
  limit 1
  for update;

  if not found then
    raise exception '没有可用于验证的配件库存行';
  end if;

  insert into public.jintan_parts_stock_in (inventory_id, quantity, remarks)
  values (v_inventory_id, 3, '事务验证')
  returning id into v_record_id;

  if not exists (
    select 1 from public.jintan_parts_inventory
    where id = v_inventory_id and quantity = v_initial_quantity + 3
  ) then
    raise exception '新增入库未使库存增加 3';
  end if;

  update public.jintan_parts_stock_in
  set remarks = '备注已修改'
  where id = v_record_id;

  if not exists (
    select 1 from public.jintan_parts_inventory
    where id = v_inventory_id and quantity = v_initial_quantity + 3
  ) then
    raise exception '修改备注意外改变了库存';
  end if;

  v_blocked := false;
  begin
    update public.jintan_parts_stock_in set quantity = 4 where id = v_record_id;
  exception when raise_exception then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception '入库数量修改未被阻止';
  end if;

  v_blocked := false;
  begin
    delete from public.jintan_parts_data where id = v_part_data_id;
  exception when foreign_key_violation then
    v_blocked := true;
  end;
  if not v_blocked then
    raise exception '有入库记录的配件资料删除未被阻止';
  end if;

  update public.jintan_parts_inventory set quantity = 2
  where id = v_inventory_id;

  v_blocked := false;
  begin
    delete from public.jintan_parts_stock_in where id = v_record_id;
  exception when raise_exception then
    v_blocked := true;
  end;
  if not v_blocked or not exists (
    select 1 from public.jintan_parts_stock_in where id = v_record_id
  ) then
    raise exception '库存不足时删除入库记录未被阻止';
  end if;

  update public.jintan_parts_inventory
  set quantity = v_initial_quantity + 3 where id = v_inventory_id;
  delete from public.jintan_parts_stock_in where id = v_record_id;

  if not exists (
    select 1 from public.jintan_parts_inventory
    where id = v_inventory_id and quantity = v_initial_quantity
  ) then
    raise exception '删除入库记录未准确回退库存';
  end if;

  raise notice '配件入库事务验证通过';
end;
$$;

rollback;
