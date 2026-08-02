revoke execute on function public.get_tooling_fixture_by_qr_token(text)
  from authenticated;
revoke execute on function public.record_tooling_fixture_action(text, text, text)
  from authenticated;

grant execute on function public.get_tooling_fixture_by_qr_token(text)
  to anon;
grant execute on function public.record_tooling_fixture_action(text, text, text)
  to anon;
