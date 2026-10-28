-- 西尼订单「生成送货单」：回写 SCM 送货单号、新增「已送货」状态排序、权限与代理限流。

-- 1. 订单保存 SCM 送货单号
alter table public."syney-pos"
  add column if not exists "DeliveryNo" text;

comment on column public."syney-pos"."DeliveryNo"
  is '西尼 SCM 送货单号（生成送货单后回写）';

-- 2. 排序视图带上 DeliveryNo；po.* 新增列会改变列顺序，必须先删后建
drop view if exists public.syney_pos_sorted;

create view public.syney_pos_sorted
with (security_invoker = true)
as
select
  po.*,
  case
    when po."Status" = '已创建' then 1
    when po."Status" in ('部分入库', '部分送货') then 2
    when po."Status" = '已送货' then 3
    when po."Status" = '已入库' then 4
    else 5
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

-- 3. 功能权限
insert into public.permissions (key, scope, module, surface, label)
values
  ('feature:syney-po-list.delivery-order', 'feature', 'syney-po-list', 'pc', '西尼订单-生成送货单')
on conflict (key) do nothing;

-- 4. 代理限流：新增 syney-delivery-order 作用域。
--    生成送货单会逐条添加安全部件明细，每分钟请求数明显多于入库单查询，单独放宽到 120 次/分钟。
alter table private.proxy_rate_limits
  drop constraint if exists proxy_rate_limits_request_count_check;
alter table private.proxy_rate_limits
  add constraint proxy_rate_limits_request_count_check
  check (request_count between 1 and 120);

create or replace function private.consume_proxy_rate_limit(
  p_scope text,
  p_ip text
) returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_scope text := btrim(coalesce(p_scope, ''));
  v_ip text := left(btrim(coalesce(p_ip, 'unknown')), 255);
  v_window_started_at timestamptz := date_trunc('minute', clock_timestamp());
  v_user_hash text;
  v_user_ip_hash text;
  v_user_lock_key text;
  v_user_ip_lock_key text;
  v_user_count integer;
  v_user_ip_count integer;
  v_required_permission text;
  v_limit integer;
begin
  if v_user_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  v_required_permission := case v_scope
    when 'syney-store-report' then 'page:syney-store-report-list'
    when 'syney-delivery-order' then 'feature:syney-po-list.delivery-order'
    when 'youmai-purchase-order' then 'page:youmai-finished-goods-stock-out'
    else null
  end;

  v_limit := case v_scope
    when 'syney-delivery-order' then 120
    else 30
  end;

  if v_required_permission is null then
    raise invalid_parameter_value using message = 'Unsupported proxy scope';
  end if;

  if not public.current_user_has_permission(v_required_permission) then
    raise insufficient_privilege using message = 'Permission denied';
  end if;

  if v_ip = '' then
    v_ip := 'unknown';
  end if;

  v_user_hash := encode(
    extensions.digest(convert_to(v_user_id::text, 'UTF8'), 'sha256'),
    'hex'
  );
  v_user_ip_hash := encode(
    extensions.digest(
      convert_to(concat(v_user_id::text, ':', v_ip), 'UTF8'),
      'sha256'
    ),
    'hex'
  );
  v_user_lock_key := concat(
    v_scope,
    ':user:',
    v_user_hash,
    ':',
    v_window_started_at
  );
  v_user_ip_lock_key := concat(
    v_scope,
    ':user_ip:',
    v_user_ip_hash,
    ':',
    v_window_started_at
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      least(v_user_lock_key, v_user_ip_lock_key),
      0
    )
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      greatest(v_user_lock_key, v_user_ip_lock_key),
      0
    )
  );

  select request_count
  into v_user_count
  from private.proxy_rate_limits
  where scope = v_scope
    and subject_kind = 'user'
    and subject_hash = v_user_hash
    and window_started_at = v_window_started_at;

  select request_count
  into v_user_ip_count
  from private.proxy_rate_limits
  where scope = v_scope
    and subject_kind = 'user_ip'
    and subject_hash = v_user_ip_hash
    and window_started_at = v_window_started_at;

  if coalesce(v_user_count, 0) >= v_limit
    or coalesce(v_user_ip_count, 0) >= v_limit then
    return false;
  end if;

  insert into private.proxy_rate_limits (
    scope,
    subject_kind,
    subject_hash,
    window_started_at,
    request_count
  ) values (
    v_scope,
    'user',
    v_user_hash,
    v_window_started_at,
    1
  )
  on conflict (scope, subject_kind, subject_hash, window_started_at)
  do update set request_count = private.proxy_rate_limits.request_count + 1;

  insert into private.proxy_rate_limits (
    scope,
    subject_kind,
    subject_hash,
    window_started_at,
    request_count
  ) values (
    v_scope,
    'user_ip',
    v_user_ip_hash,
    v_window_started_at,
    1
  )
  on conflict (scope, subject_kind, subject_hash, window_started_at)
  do update set request_count = private.proxy_rate_limits.request_count + 1;

  delete from private.proxy_rate_limits
  where window_started_at < v_window_started_at - interval '10 minutes';

  return true;
end;
$$;
