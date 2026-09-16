create or replace function public.update_syney_po_items(
  p_ids bigint[],
  p_values jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_expected_count integer;
  v_updated_count integer;
  v_patch public."syney-po-items"%rowtype;
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    raise exception using
      errcode = '22023',
      message = 'p_ids must contain at least one identifier';
  end if;

  if exists (
    select 1
    from unnest(p_ids) as requested(id)
    where requested.id is null or requested.id <= 0
  ) then
    raise exception using
      errcode = '22023',
      message = 'p_ids must contain only positive, non-null identifiers';
  end if;

  if p_values is null or pg_catalog.jsonb_typeof(p_values) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'p_values must be a JSON object';
  end if;

  if p_values = '{}'::jsonb then
    raise exception using
      errcode = '22023',
      message = 'p_values must contain at least one field';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_object_keys(p_values) as supplied(key)
    where supplied.key <> all (
      array[
        'No',
        'ParamSpec',
        'PartCode',
        'PartModel',
        'PartName',
        'PartName2',
        'PartNo',
        'PoId',
        'Qty',
        'Remark',
        'SONo',
        'Spec',
        'Unit'
      ]::text[]
    )
  ) then
    raise exception using
      errcode = '22023',
      message = 'p_values contains unsupported fields';
  end if;

  v_patch := pg_catalog.jsonb_populate_record(
    null::public."syney-po-items",
    p_values
  );

  select count(distinct id)::integer
  into v_expected_count
  from unnest(p_ids) as requested(id);

  with updated_rows as (
    update public."syney-po-items" as item
    set
      "No" = case when p_values ? 'No' then v_patch."No" else item."No" end,
      "ParamSpec" = case when p_values ? 'ParamSpec' then v_patch."ParamSpec" else item."ParamSpec" end,
      "PartCode" = case when p_values ? 'PartCode' then v_patch."PartCode" else item."PartCode" end,
      "PartModel" = case when p_values ? 'PartModel' then v_patch."PartModel" else item."PartModel" end,
      "PartName" = case when p_values ? 'PartName' then v_patch."PartName" else item."PartName" end,
      "PartName2" = case when p_values ? 'PartName2' then v_patch."PartName2" else item."PartName2" end,
      "PartNo" = case when p_values ? 'PartNo' then v_patch."PartNo" else item."PartNo" end,
      "PoId" = case when p_values ? 'PoId' then v_patch."PoId" else item."PoId" end,
      "Qty" = case when p_values ? 'Qty' then v_patch."Qty" else item."Qty" end,
      "Remark" = case when p_values ? 'Remark' then v_patch."Remark" else item."Remark" end,
      "SONo" = case when p_values ? 'SONo' then v_patch."SONo" else item."SONo" end,
      "Spec" = case when p_values ? 'Spec' then v_patch."Spec" else item."Spec" end,
      "Unit" = case when p_values ? 'Unit' then v_patch."Unit" else item."Unit" end
    where item.id = any(p_ids)
    returning
      item."ParamSpec",
      item."PartName",
      item."PartNo",
      item."Spec"
  ),
  inserted_specs as (
    insert into public."syney-specs" (
      "ParamSpec",
      "PartName",
      "PartNo",
      "Spec"
    )
    select distinct
      "ParamSpec",
      "PartName",
      "PartNo",
      "Spec"
    from updated_rows
    where nullif(btrim("PartNo"), '') is not null
    on conflict ("PartNo") do nothing
    returning 1
  )
  select count(*)::integer
  into v_updated_count
  from updated_rows;

  if v_updated_count <> v_expected_count then
    raise exception using
      errcode = 'P0001',
      message = pg_catalog.format(
        'Expected to update %s Syney PO items, but updated %s',
        v_expected_count,
        v_updated_count
      );
  end if;

  return v_updated_count;
end;
$$;

revoke all on function public.update_syney_po_items(bigint[], jsonb) from public, anon;
grant execute on function public.update_syney_po_items(bigint[], jsonb) to authenticated, service_role;

create or replace view public.syney_pos_sorted
with (security_invoker = true)
as
select
  po.*,
  case
    when po."Status" = '已创建' then 1
    when po."Status" in ('部分入库', '部分送货') then 2
    when po."Status" = '已入库' then 3
    else 4
  end::smallint as status_sort_weight,
  case
    when po."Status" = '已入库' then
      coalesce(-to_char(po."EndDate", 'YYYYMMDD')::integer, 2147483647)
    else
      coalesce(to_char(po."EndDate", 'YYYYMMDD')::integer, 0)
  end::integer as end_date_sort_key
from public."syney-pos" as po;

revoke all on table public.syney_pos_sorted from public, anon;
grant select on table public.syney_pos_sorted to authenticated, service_role;
