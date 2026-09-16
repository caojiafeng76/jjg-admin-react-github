-- A caller authenticated with a normal user JWT can choose p_ip. Keep the
-- unforgeable per-user ceiling, but scope the IP dimension to that same user
-- so a direct RPC caller cannot exhaust another user's address quota.
delete from private.proxy_rate_limits;

alter table private.proxy_rate_limits
  drop constraint if exists proxy_rate_limits_subject_kind_check;
alter table private.proxy_rate_limits
  add constraint proxy_rate_limits_subject_kind_check
  check (subject_kind in ('user', 'user_ip'));

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
begin
  if v_user_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  v_required_permission := case v_scope
    when 'syney-store-report' then 'page:syney-store-report-list'
    when 'youmai-purchase-order' then 'page:youmai-finished-goods-stock-out'
    else null
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

  if coalesce(v_user_count, 0) >= 30
    or coalesce(v_user_ip_count, 0) >= 30 then
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
