create collation if not exists public.zh_cn_numeric (
  provider = icu,
  locale = 'zh-Hans-CN-u-kn-true',
  deterministic = true
);

do $$
declare
  v_collation record;
begin
  select
    c.collprovider,
    c.collisdeterministic,
    c.colliculocale
  into v_collation
  from pg_catalog.pg_collation as c
  join pg_catalog.pg_namespace as n
    on n.oid = c.collnamespace
  where n.nspname = 'public'
    and c.collname = 'zh_cn_numeric'
  limit 1;

  if not found then
    raise exception using
      errcode = '42704',
      message = 'public.zh_cn_numeric collation was not created';
  end if;

  if v_collation.collprovider <> 'i'
    or not v_collation.collisdeterministic
    or v_collation.colliculocale is null
    or v_collation.colliculocale not in (
      'zh-Hans-CN-u-kn-true',
      'zh-Hans-CN-u-kn'
    )
  then
    raise exception using
      errcode = '42710',
      message = 'public.zh_cn_numeric exists with an incompatible definition';
  end if;
end;
$$;

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
  end::integer as end_date_sort_key,
  coalesce(po."No", '') collate public.zh_cn_numeric as no_natural_sort_key,
  coalesce(po."SONo", '') collate public.zh_cn_numeric as sono_natural_sort_key
from public."syney-pos" as po;

revoke all on table public.syney_pos_sorted from public, anon;
grant select on table public.syney_pos_sorted to authenticated, service_role;
