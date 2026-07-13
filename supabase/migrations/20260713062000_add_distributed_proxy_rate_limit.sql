create table if not exists private.proxy_rate_limits (
  scope text not null,
  subject_kind text not null check (subject_kind in ('user', 'ip')),
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 1 and 30),
  primary key (scope, subject_kind, subject_hash, window_started_at)
);

create index if not exists proxy_rate_limits_window_started_at_idx
  on private.proxy_rate_limits (window_started_at);

revoke all on table private.proxy_rate_limits from public, anon, authenticated;

create or replace function public.consume_proxy_rate_limit(
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
  v_ip_hash text;
  v_user_lock_key text;
  v_ip_lock_key text;
  v_user_count integer;
  v_ip_count integer;
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
  v_ip_hash := encode(
    extensions.digest(convert_to(v_ip, 'UTF8'), 'sha256'),
    'hex'
  );
  v_user_lock_key := concat(v_scope, ':user:', v_user_hash, ':', v_window_started_at);
  v_ip_lock_key := concat(v_scope, ':ip:', v_ip_hash, ':', v_window_started_at);

  -- Always acquire both transaction locks in lexical order. This serializes
  -- concurrent requests without deadlocking when users share an address.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(least(v_user_lock_key, v_ip_lock_key), 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(greatest(v_user_lock_key, v_ip_lock_key), 0)
  );

  select request_count
  into v_user_count
  from private.proxy_rate_limits
  where scope = v_scope
    and subject_kind = 'user'
    and subject_hash = v_user_hash
    and window_started_at = v_window_started_at;

  select request_count
  into v_ip_count
  from private.proxy_rate_limits
  where scope = v_scope
    and subject_kind = 'ip'
    and subject_hash = v_ip_hash
    and window_started_at = v_window_started_at;

  if coalesce(v_user_count, 0) >= 30 or coalesce(v_ip_count, 0) >= 30 then
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
    'ip',
    v_ip_hash,
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

revoke all on function public.consume_proxy_rate_limit(text, text) from public, anon;
grant execute on function public.consume_proxy_rate_limit(text, text)
  to authenticated, service_role;
