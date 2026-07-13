alter function public.consume_proxy_rate_limit(text, text)
  set schema private;

revoke all on function private.consume_proxy_rate_limit(text, text)
  from public, anon;
grant execute on function private.consume_proxy_rate_limit(text, text)
  to authenticated, service_role;

create function public.consume_proxy_rate_limit(
  p_scope text,
  p_ip text
) returns boolean
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.consume_proxy_rate_limit(p_scope, p_ip);
$$;

revoke all on function public.consume_proxy_rate_limit(text, text)
  from public, anon;
grant execute on function public.consume_proxy_rate_limit(text, text)
  to authenticated, service_role;
