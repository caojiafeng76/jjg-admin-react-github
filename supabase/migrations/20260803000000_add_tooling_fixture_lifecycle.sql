alter table public.tooling_fixtures
  add column if not exists lifecycle text not null default '正常';

alter table public.tooling_fixtures
  add constraint tooling_fixtures_lifecycle_valid
    check (lifecycle in ('正常', '维修', '报废'));

comment on column public.tooling_fixtures.lifecycle is '寿命：正常、维修或报废';

-- update RPC function to include lifecycle
drop function if exists public.get_tooling_fixture_by_qr_token(text);

create or replace function public.get_tooling_fixture_by_qr_token(
  target_qr_token text
)
returns table (
  id uuid,
  fixture_no text,
  category text,
  applicable_product_drawing_no text,
  product_name text,
  applicable_equipment text,
  storage_location text,
  manufactured_date date,
  manufacturer text,
  status text,
  lifecycle text,
  last_maintenance_date date,
  maintenance_cycle_days integer,
  responsible_person text,
  remarks text
)
language sql
security definer
set search_path = public
as $$
  select
    fixture.id,
    fixture.fixture_no,
    fixture.category,
    fixture.applicable_product_drawing_no,
    fixture.product_name,
    fixture.applicable_equipment,
    fixture.storage_location,
    fixture.manufactured_date,
    fixture.manufacturer,
    fixture.status,
    fixture.lifecycle,
    fixture.last_maintenance_date,
    fixture.maintenance_cycle_days,
    fixture.responsible_person,
    fixture.remarks
  from public.tooling_fixtures as fixture
  where fixture.qr_token = btrim(target_qr_token)
  limit 1;
$$;

revoke execute on function public.get_tooling_fixture_by_qr_token(text)
  from public;
grant execute on function public.get_tooling_fixture_by_qr_token(text)
  to anon, authenticated;
