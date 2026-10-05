-- 业务规则验证使用事务内临时配件，末尾回滚。
begin;
do $$
declare
  v_part_id uuid;
  v_inventory_id uuid;
  v_record_id uuid;
  v_blocked boolean;
begin
  insert into public.jintan_parts_data (part_name)
  values ('__出库事务验证__' || gen_random_uuid()::text)
  returning id into v_part_id;
  select id into v_inventory_id from public.jintan_parts_inventory
  where part_data_id = v_part_id;
  perform set_config('jintan.test_inventory_id', v_inventory_id::text, true);
  update public.jintan_parts_inventory set quantity = 10 where id = v_inventory_id;

  insert into public.jintan_parts_stock_out (inventory_id, quantity, remarks)
  values (v_inventory_id, 3, '事务验证') returning id into v_record_id;
  if not exists (select 1 from public.jintan_parts_inventory where id = v_inventory_id and quantity = 7) then
    raise exception '正常出库未准确扣减库存';
  end if;
  update public.jintan_parts_stock_out set remarks = '备注验证' where id = v_record_id;
  if not exists (select 1 from public.jintan_parts_inventory where id = v_inventory_id and quantity = 7) then
    raise exception '修改备注意外改变库存';
  end if;

  v_blocked := false;
  begin
    update public.jintan_parts_stock_out set quantity = 4 where id = v_record_id;
  exception when raise_exception then v_blocked := true;
  end;
  if not v_blocked then raise exception '数量修改未被阻止'; end if;

  v_blocked := false;
  begin
    update public.jintan_parts_stock_out set inventory_id = gen_random_uuid() where id = v_record_id;
  exception when raise_exception then v_blocked := true;
  end;
  if not v_blocked then raise exception '配件修改未被阻止'; end if;

  v_blocked := false;
  begin
    insert into public.jintan_parts_stock_out (inventory_id, quantity) values (v_inventory_id, 0);
  exception when check_violation then v_blocked := true;
  end;
  if not v_blocked then raise exception '零数量出库未被阻止'; end if;

  v_blocked := false;
  begin
    insert into public.jintan_parts_stock_out (inventory_id, quantity) values (v_inventory_id, 8);
  exception when raise_exception then v_blocked := true;
  end;
  if not v_blocked or not exists (select 1 from public.jintan_parts_inventory where id = v_inventory_id and quantity = 7) then
    raise exception '超库存出库未原子失败';
  end if;
  if (select count(*) from public.jintan_parts_stock_out where inventory_id = v_inventory_id) <> 1 then
    raise exception '失败出库留下了流水';
  end if;

  v_blocked := false;
  begin
    delete from public.jintan_parts_data where id = v_part_id;
  exception when foreign_key_violation then v_blocked := true;
  end;
  if not v_blocked then raise exception '有流水的配件删除未被阻止'; end if;

  delete from public.jintan_parts_stock_out where id = v_record_id;
  if not exists (select 1 from public.jintan_parts_inventory where id = v_inventory_id and quantity = 10) then
    raise exception '删除出库未准确回补库存';
  end if;

  insert into public.jintan_parts_stock_out (inventory_id, quantity) values (v_inventory_id, 10)
  returning id into v_record_id;
  if not exists (select 1 from public.jintan_parts_inventory where id = v_inventory_id and quantity = 0) then
    raise exception '库存恰好扣至零验证失败';
  end if;
  v_blocked := false;
  begin
    insert into public.jintan_parts_stock_out (inventory_id, quantity) values (v_inventory_id, 1);
  exception when raise_exception then v_blocked := true;
  end;
  if not v_blocked then raise exception '零库存出库未被阻止'; end if;
  delete from public.jintan_parts_stock_out where id = v_record_id;
  insert into public.jintan_parts_stock_out (inventory_id, quantity) values (v_inventory_id, 1);
end;
$$;

-- 使用无业务权限的认证身份，检查出库 RLS 和库存只读策略没有放开写入。
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
do $$
declare
  v_blocked boolean := false;
  v_count integer;
begin
  if exists (select 1 from public.jintan_parts_stock_out) then
    raise exception '无权限认证身份可以读取出库流水';
  end if;
  begin
    insert into public.jintan_parts_stock_out (inventory_id, quantity)
    values (current_setting('jintan.test_inventory_id')::uuid, 1);
  exception when insufficient_privilege then v_blocked := true;
  end;
  if not v_blocked then raise exception '无权限认证身份可以创建出库流水'; end if;
  update public.jintan_parts_inventory set quantity = 20
  where id = current_setting('jintan.test_inventory_id')::uuid;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception '无库存权限认证身份可以直接改库存'; end if;
end;
$$;
reset role;
rollback;

-- 并发验证专用配件如存在，检查一次成功后精确清理该配件与流水。
begin;
do $$
declare
  v_inventory_id uuid;
begin
  select id into v_inventory_id from public.jintan_parts_inventory
  where part_data_id = 'e78f4adc-bdae-4f96-8a9a-5c93428ea41d';
  if found then
    if not exists (select 1 from public.jintan_parts_inventory where id = v_inventory_id and quantity = 3)
       or (select count(*) from public.jintan_parts_stock_out where inventory_id = v_inventory_id) <> 1 then
      raise exception '并发验证结果不符：应为库存 3、流水 1 条';
    end if;
    delete from public.jintan_parts_stock_out where inventory_id = v_inventory_id and remarks = '并发验证';
    delete from public.jintan_parts_data
    where id = 'e78f4adc-bdae-4f96-8a9a-5c93428ea41d' and part_name = '__出库并发验证__';
  end if;
end;
$$;
commit;
select '出库事务验证通过，临时数据已回滚，并发验证配件已清理' as result;
