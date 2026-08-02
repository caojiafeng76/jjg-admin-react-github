create table if not exists public.tooling_fixtures (
  id uuid primary key default gen_random_uuid(),
  fixture_no text not null,
  category text not null default '',
  applicable_product_drawing_no text not null default '',
  product_name text not null default '',
  applicable_equipment text not null default '',
  storage_location text not null default '',
  manufactured_date date,
  manufacturer text not null default '',
  status text not null default '未使用',
  last_maintenance_date date,
  maintenance_cycle_days integer,
  responsible_person text not null default '',
  remarks text not null default '',
  qr_token text not null default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tooling_fixtures_fixture_no_not_blank check (btrim(fixture_no) <> ''),
  constraint tooling_fixtures_status_valid check (status in ('未使用', '使用中')),
  constraint tooling_fixtures_maintenance_cycle_valid check (
    maintenance_cycle_days is null or maintenance_cycle_days > 0
  ),
  constraint tooling_fixtures_qr_token_not_blank check (btrim(qr_token) <> ''),
  constraint tooling_fixtures_fixture_no_unique unique (fixture_no),
  constraint tooling_fixtures_qr_token_unique unique (qr_token)
);

comment on table public.tooling_fixtures is '工装资料';
comment on column public.tooling_fixtures.fixture_no is '工装模具编号';
comment on column public.tooling_fixtures.category is '类别';
comment on column public.tooling_fixtures.applicable_product_drawing_no is '适用产品图号';
comment on column public.tooling_fixtures.product_name is '产品名称';
comment on column public.tooling_fixtures.applicable_equipment is '适用设备';
comment on column public.tooling_fixtures.storage_location is '存放位置';
comment on column public.tooling_fixtures.manufactured_date is '制作日期';
comment on column public.tooling_fixtures.manufacturer is '制作厂商';
comment on column public.tooling_fixtures.status is '状态';
comment on column public.tooling_fixtures.last_maintenance_date is '上次保养日期';
comment on column public.tooling_fixtures.maintenance_cycle_days is '保养周期，单位：天';
comment on column public.tooling_fixtures.responsible_person is '责任人';
comment on column public.tooling_fixtures.qr_token is '公开扫码唯一令牌';

create index if not exists idx_tooling_fixtures_status
  on public.tooling_fixtures (status);
create index if not exists idx_tooling_fixtures_updated_at_desc
  on public.tooling_fixtures (updated_at desc);

drop trigger if exists update_tooling_fixtures_updated_at
  on public.tooling_fixtures;
create trigger update_tooling_fixtures_updated_at
before update on public.tooling_fixtures
for each row execute function public.update_updated_at_column();

alter table public.tooling_fixtures enable row level security;
drop policy if exists "Tooling fixtures permission select"
  on public.tooling_fixtures;
create policy "Tooling fixtures permission select"
on public.tooling_fixtures for select to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:fixture-data')
  or public.current_user_has_permission('page:fixture-records')
);

drop policy if exists "Tooling fixtures permission insert"
  on public.tooling_fixtures;
create policy "Tooling fixtures permission insert"
on public.tooling_fixtures for insert to authenticated
with check (
  public.is_admin()
  or public.current_user_has_permission('page:fixture-data')
);

drop policy if exists "Tooling fixtures permission update"
  on public.tooling_fixtures;
create policy "Tooling fixtures permission update"
on public.tooling_fixtures for update to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:fixture-data')
)
with check (
  public.is_admin()
  or public.current_user_has_permission('page:fixture-data')
);

drop policy if exists "Tooling fixtures permission delete"
  on public.tooling_fixtures;
create policy "Tooling fixtures permission delete"
on public.tooling_fixtures for delete to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:fixture-data')
);

create table if not exists public.tooling_fixture_usage_records (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.tooling_fixtures (id)
    on update cascade on delete restrict,
  action text not null,
  operator_name text not null,
  created_at timestamptz not null default now(),
  constraint tooling_fixture_usage_records_action_valid
    check (action in ('使用', '归还')),
  constraint tooling_fixture_usage_records_operator_not_blank
    check (btrim(operator_name) <> '')
);

comment on table public.tooling_fixture_usage_records is '工装出库/归还记录';
comment on column public.tooling_fixture_usage_records.action is '动作：使用或归还';
comment on column public.tooling_fixture_usage_records.operator_name is '操作者';

create index if not exists idx_tooling_fixture_usage_records_fixture_id
  on public.tooling_fixture_usage_records (fixture_id);
create index if not exists idx_tooling_fixture_usage_records_created_at_desc
  on public.tooling_fixture_usage_records (created_at desc);

alter table public.tooling_fixture_usage_records enable row level security;
drop policy if exists "Tooling fixture usage records permission select"
  on public.tooling_fixture_usage_records;
create policy "Tooling fixture usage records permission select"
on public.tooling_fixture_usage_records for select to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:fixture-records')
);

drop policy if exists "Tooling fixture usage records permission delete"
  on public.tooling_fixture_usage_records;
create policy "Tooling fixture usage records permission delete"
on public.tooling_fixture_usage_records for delete to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:fixture-records')
);

revoke all on table public.tooling_fixtures from anon;
revoke all on table public.tooling_fixture_usage_records from anon;

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
    fixture.last_maintenance_date,
    fixture.maintenance_cycle_days,
    fixture.responsible_person,
    fixture.remarks
  from public.tooling_fixtures as fixture
  where fixture.qr_token = btrim(target_qr_token)
  limit 1;
$$;

create or replace function public.record_tooling_fixture_action(
  target_qr_token text,
  target_action text,
  target_operator_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  fixture public.tooling_fixtures;
  usage_record public.tooling_fixture_usage_records;
  normalized_action text := btrim(target_action);
  normalized_operator_name text := btrim(target_operator_name);
begin
  if normalized_action not in ('使用', '归还') then
    raise exception '工装操作无效，只能使用或归还';
  end if;

  if normalized_operator_name = '' then
    raise exception '请输入操作者姓名';
  end if;

  if char_length(normalized_operator_name) > 50 then
    raise exception '操作者姓名不能超过 50 个字符';
  end if;

  select * into fixture
  from public.tooling_fixtures
  where qr_token = btrim(target_qr_token)
  for update;

  if not found then
    raise exception '工装二维码无效或已失效';
  end if;

  if normalized_action = '使用' and fixture.status <> '未使用' then
    raise exception '工装当前已在使用中，不能重复使用';
  end if;

  if normalized_action = '归还' and fixture.status <> '使用中' then
    raise exception '工装当前未使用，不能归还';
  end if;

  update public.tooling_fixtures
  set status = case
      when normalized_action = '使用' then '使用中'
      else '未使用'
    end
  where id = fixture.id
  returning * into fixture;

  insert into public.tooling_fixture_usage_records (
    fixture_id,
    action,
    operator_name
  ) values (
    fixture.id,
    normalized_action,
    normalized_operator_name
  )
  returning * into usage_record;

  return jsonb_build_object(
    'fixture', jsonb_build_object(
      'id', fixture.id,
      'fixture_no', fixture.fixture_no,
      'status', fixture.status
    ),
    'record', jsonb_build_object(
      'id', usage_record.id,
      'action', usage_record.action,
      'operator_name', usage_record.operator_name,
      'created_at', usage_record.created_at
    )
  );
end;
$$;

revoke execute on function public.get_tooling_fixture_by_qr_token(text)
  from public;
grant execute on function public.get_tooling_fixture_by_qr_token(text)
  to anon, authenticated;
revoke execute on function public.record_tooling_fixture_action(text, text, text)
  from public;
grant execute on function public.record_tooling_fixture_action(text, text, text)
  to anon, authenticated;
