create function public.import_syney_purchase_order(p_po_no text, p_groups jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  group_data jsonb;
  production_no text;
  order_id bigint;
  last_serial bigint;
  inserted_items integer;
  created_count integer := 0;
  skipped_count integer := 0;
begin
  if auth.uid() is null
    or not coalesce(public.current_user_has_permission('page:syney-po-list'), false)
    or not coalesce(public.current_user_has_permission('feature:syney-po-list.create'), false)
  then
    raise exception '无权新建西尼订单' using errcode = '42501';
  end if;

  if p_po_no is null or p_po_no !~ '^[A-Za-z0-9_-]{1,64}$'
    or jsonb_typeof(p_groups) is distinct from 'array'
  then
    raise exception '西尼订单参数不正确' using errcode = '22023';
  end if;
  if jsonb_array_length(p_groups) = 0 then
    raise exception '没有可生成的西尼订单' using errcode = '22023';
  end if;

  -- Serialize imports from SCM before checking which production numbers already exist.
  select "SyneySerialNo" into last_serial
  from public."syney-serial-no" where id = 1
  for update;
  if last_serial is null then
    raise exception '西尼流水号未配置';
  end if;

  for group_data in select value from jsonb_array_elements(p_groups)
  loop
    production_no := btrim(group_data ->> 'soNo');
    if coalesce(production_no, '') = '' then
      raise exception '西尼订单缺少生产编号' using errcode = '22023';
    end if;

    if exists (
      select 1 from public."syney-pos"
      where "No" = p_po_no and "SONo" = production_no
    ) then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    if nullif(group_data ->> 'endDate', '') is null
      or jsonb_typeof(group_data -> 'items') is distinct from 'array'
    then
      raise exception '西尼订单缺少交货日期或明细' using errcode = '22023';
    end if;
    if jsonb_array_length(group_data -> 'items') = 0 then
      raise exception '西尼订单缺少明细' using errcode = '22023';
    end if;

    insert into public."syney-pos" (
      "No", "SONo", "SerialNo", "EndDate", "Brand", "Spec", "Technique", "Remark"
    ) values (
      p_po_no, production_no, last_serial + 1, (group_data ->> 'endDate')::date,
      group_data ->> 'brand', group_data ->> 'spec', group_data ->> 'technique', group_data ->> 'remark'
    ) returning id into order_id;

    last_serial := last_serial + 1;
    insert into public."syney-po-items" (
      "PoId", "No", "SONo", "PartNo", "PartName", "Spec", "ParamSpec", "Qty", "Unit",
      "Remark", "PartName2", "PartModel", "PartCode"
    )
    select order_id, p_po_no, production_no, item."PartNo", item."PartName", item."Spec",
      item."ParamSpec", item."Qty", item."Unit", item."Remark", item."PartName2", item."PartModel",
      nullif(item."PartCodePrefix", '') || last_serial::text
    from jsonb_to_recordset(group_data -> 'items') as item(
      "PartNo" text, "PartName" text, "Spec" text, "ParamSpec" text, "Qty" integer,
      "Unit" text, "Remark" text, "PartName2" text, "PartModel" text, "PartCodePrefix" text
    )
    where nullif(btrim(item."PartNo"), '') is not null
      and nullif(btrim(item."PartName"), '') is not null
      and nullif(btrim(item."Unit"), '') is not null
      and item."Qty" >= 0;

    get diagnostics inserted_items = row_count;
    if inserted_items <> jsonb_array_length(group_data -> 'items') then
      raise exception '西尼订单明细缺少件号、名称、数量或单位' using errcode = '22023';
    end if;

    created_count := created_count + 1;
  end loop;

  if created_count > 0 then
    update public."syney-serial-no" set "SyneySerialNo" = last_serial where id = 1;
  end if;
  return jsonb_build_object('created', created_count, 'skipped', skipped_count);
end;
$$;

revoke execute on function public.import_syney_purchase_order(text, jsonb) from public, anon, authenticated;
grant execute on function public.import_syney_purchase_order(text, jsonb) to authenticated;
