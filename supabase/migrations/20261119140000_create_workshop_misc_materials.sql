-- ============================================================
-- 车间杂项材料库存
--   workshop_misc_materials_data                  材料资料（型号 + 客户型号 + 规格 + 类别 唯一）
--   workshop_misc_materials_inventory             材料库存，与资料一对一，资料新增时自动建 0 库存行
--   workshop_misc_materials_stock_in / _stock_out 出入库流水，单据可同时填原材料/半成品/成品数量，触发器同事务加减库存
--   workshop_misc_materials_inventory_adjustments 直接改库存数量时由触发器写入的调整流水
--   get_workshop_misc_materials_categories        历史已填类别联想列表
--   get_workshop_misc_materials_monthly_report    月度报表：按维度（合计/原材料/半成品/成品）返回上月结余 / 本月入库 / 出库 / 调整 / 月末结存
-- ============================================================

-- 1. 材料资料
create table public.workshop_misc_materials_data (
  id             uuid primary key default gen_random_uuid(),
  model          text not null,
  customer_model text not null default '',
  specification  text not null default '',
  category       text not null default '',
  remarks        text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint workshop_misc_materials_data_model_not_blank check (btrim(model) <> ''),
  constraint workshop_misc_materials_data_unique unique (model, customer_model, specification, category)
);

comment on table public.workshop_misc_materials_data is '车间杂项材料资料';
comment on column public.workshop_misc_materials_data.model is '型号';
comment on column public.workshop_misc_materials_data.customer_model is '客户型号';
comment on column public.workshop_misc_materials_data.specification is '规格';
comment on column public.workshop_misc_materials_data.category is '类别';
comment on column public.workshop_misc_materials_data.remarks is '备注';

create index idx_workshop_misc_materials_data_updated_at_desc
  on public.workshop_misc_materials_data (updated_at desc);
create index idx_workshop_misc_materials_data_category
  on public.workshop_misc_materials_data (category);

create trigger update_workshop_misc_materials_data_updated_at
before update on public.workshop_misc_materials_data
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.workshop_misc_materials_data
for each row execute function public.prevent_viewer_dml();

-- 2. 材料库存
create table public.workshop_misc_materials_inventory (
  id                     uuid primary key default gen_random_uuid(),
  material_data_id       uuid not null references public.workshop_misc_materials_data (id) on update cascade on delete cascade,
  model                  text not null,
  customer_model         text not null default '',
  specification          text not null default '',
  category               text not null default '',
  raw_material_quantity  integer not null default 0,
  semi_finished_quantity integer not null default 0,
  finished_quantity      integer not null default 0,
  total_quantity         integer generated always as (raw_material_quantity + semi_finished_quantity + finished_quantity) stored,
  remarks                text not null default '',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint workshop_misc_materials_inventory_model_not_blank check (btrim(model) <> ''),
  constraint workshop_misc_materials_inventory_raw_non_negative check (raw_material_quantity >= 0),
  constraint workshop_misc_materials_inventory_semi_non_negative check (semi_finished_quantity >= 0),
  constraint workshop_misc_materials_inventory_finished_non_negative check (finished_quantity >= 0),
  constraint workshop_misc_materials_inventory_data_unique unique (material_data_id)
);

comment on table public.workshop_misc_materials_inventory is '车间杂项材料库存';
comment on column public.workshop_misc_materials_inventory.material_data_id is '关联材料资料 ID';
comment on column public.workshop_misc_materials_inventory.model is '型号快照';
comment on column public.workshop_misc_materials_inventory.customer_model is '客户型号快照';
comment on column public.workshop_misc_materials_inventory.specification is '规格快照';
comment on column public.workshop_misc_materials_inventory.category is '类别快照';
comment on column public.workshop_misc_materials_inventory.raw_material_quantity is '原材料数量';
comment on column public.workshop_misc_materials_inventory.semi_finished_quantity is '半成品数量';
comment on column public.workshop_misc_materials_inventory.finished_quantity is '成品数量';
comment on column public.workshop_misc_materials_inventory.total_quantity is '合计（原材料 + 半成品 + 成品）';
comment on column public.workshop_misc_materials_inventory.remarks is '备注';

create index idx_workshop_misc_materials_inventory_updated_at_desc
  on public.workshop_misc_materials_inventory (updated_at desc);
create index idx_workshop_misc_materials_inventory_category
  on public.workshop_misc_materials_inventory (category);

create trigger update_workshop_misc_materials_inventory_updated_at
before update on public.workshop_misc_materials_inventory
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.workshop_misc_materials_inventory
for each row execute function public.prevent_viewer_dml();

-- 资料新增时建库存行，型号/客户型号/规格/类别变更时同步快照。
-- security definer：只有资料页权限的用户也能新建或修改资料，不被库存表 RLS 拦截。
create function public.handle_workshop_misc_materials_data_inventory_sync()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.workshop_misc_materials_inventory (
      material_data_id, model, customer_model, specification, category
    )
    values (new.id, new.model, new.customer_model, new.specification, new.category)
    on conflict (material_data_id) do nothing;
    return new;
  end if;

  update public.workshop_misc_materials_inventory
  set model = new.model,
      customer_model = new.customer_model,
      specification = new.specification,
      category = new.category
  where material_data_id = new.id
    and (model, customer_model, specification, category)
      is distinct from (new.model, new.customer_model, new.specification, new.category);

  return new;
end;
$$;

revoke all on function public.handle_workshop_misc_materials_data_inventory_sync() from public;

create trigger workshop_misc_materials_data_inventory_sync
after insert or update of model, customer_model, specification, category
  on public.workshop_misc_materials_data
for each row execute function public.handle_workshop_misc_materials_data_inventory_sync();

-- 3. 入库流水
create table public.workshop_misc_materials_stock_in (
  id                     uuid primary key default gen_random_uuid(),
  inventory_id           uuid not null references public.workshop_misc_materials_inventory (id) on delete restrict,
  model                  text not null default '',
  customer_model         text not null default '',
  specification          text not null default '',
  category               text not null default '',
  raw_material_quantity  integer not null default 0 check (raw_material_quantity >= 0),
  semi_finished_quantity integer not null default 0 check (semi_finished_quantity >= 0),
  finished_quantity      integer not null default 0 check (finished_quantity >= 0),
  total_quantity         integer generated always as (raw_material_quantity + semi_finished_quantity + finished_quantity) stored,
  remarks                text not null default '',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint workshop_misc_materials_stock_in_has_quantity
    check (raw_material_quantity + semi_finished_quantity + finished_quantity > 0)
);

comment on table public.workshop_misc_materials_stock_in is '车间杂项材料入库流水';
comment on column public.workshop_misc_materials_stock_in.inventory_id is '关联材料库存 ID';
comment on column public.workshop_misc_materials_stock_in.raw_material_quantity is '原材料入库数量';
comment on column public.workshop_misc_materials_stock_in.semi_finished_quantity is '半成品入库数量';
comment on column public.workshop_misc_materials_stock_in.finished_quantity is '成品入库数量';
comment on column public.workshop_misc_materials_stock_in.total_quantity is '入库合计';

create index idx_workshop_misc_materials_stock_in_created_at_desc
  on public.workshop_misc_materials_stock_in (created_at desc);
create index idx_workshop_misc_materials_stock_in_inventory_id
  on public.workshop_misc_materials_stock_in (inventory_id);

create trigger update_workshop_misc_materials_stock_in_updated_at
before update on public.workshop_misc_materials_stock_in
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.workshop_misc_materials_stock_in
for each row execute function public.prevent_viewer_dml();

-- 快照由数据库填写，客户端不能伪造材料资料。写入库存与流水处于同一事务。
create function public.handle_workshop_misc_materials_stock_in()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raw integer;
  v_semi integer;
  v_finished integer;
begin
  if tg_op = 'INSERT' then
    select model, customer_model, specification, category
      into new.model, new.customer_model, new.specification, new.category
    from public.workshop_misc_materials_inventory
    where id = new.inventory_id
    for update;

    if not found then
      raise exception '材料库存不存在，无法入库';
    end if;

    update public.workshop_misc_materials_inventory
    set raw_material_quantity = raw_material_quantity + new.raw_material_quantity,
        semi_finished_quantity = semi_finished_quantity + new.semi_finished_quantity,
        finished_quantity = finished_quantity + new.finished_quantity
    where id = new.inventory_id;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.model, new.customer_model, new.specification, new.category,
        new.raw_material_quantity, new.semi_finished_quantity, new.finished_quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.model, old.customer_model, old.specification, old.category,
        old.raw_material_quantity, old.semi_finished_quantity, old.finished_quantity, old.created_at) then
      raise exception '入库记录仅允许修改备注';
    end if;
    return new;
  end if;

  select raw_material_quantity, semi_finished_quantity, finished_quantity
    into v_raw, v_semi, v_finished
  from public.workshop_misc_materials_inventory
  where id = old.inventory_id
  for update;

  if not found then
    raise exception '材料库存不存在，无法删除该入库记录';
  end if;

  if v_raw < old.raw_material_quantity then
    raise exception '当前原材料库存不足，无法删除该入库记录';
  end if;
  if v_semi < old.semi_finished_quantity then
    raise exception '当前半成品库存不足，无法删除该入库记录';
  end if;
  if v_finished < old.finished_quantity then
    raise exception '当前成品库存不足，无法删除该入库记录';
  end if;

  update public.workshop_misc_materials_inventory
  set raw_material_quantity = raw_material_quantity - old.raw_material_quantity,
      semi_finished_quantity = semi_finished_quantity - old.semi_finished_quantity,
      finished_quantity = finished_quantity - old.finished_quantity
  where id = old.inventory_id;

  return old;
end;
$$;

revoke all on function public.handle_workshop_misc_materials_stock_in() from public;

create trigger workshop_misc_materials_stock_in_apply
before insert or update or delete on public.workshop_misc_materials_stock_in
for each row execute function public.handle_workshop_misc_materials_stock_in();

-- 4. 出库流水
create table public.workshop_misc_materials_stock_out (
  id                     uuid primary key default gen_random_uuid(),
  inventory_id           uuid not null references public.workshop_misc_materials_inventory (id) on delete restrict,
  model                  text not null default '',
  customer_model         text not null default '',
  specification          text not null default '',
  category               text not null default '',
  raw_material_quantity  integer not null default 0 check (raw_material_quantity >= 0),
  semi_finished_quantity integer not null default 0 check (semi_finished_quantity >= 0),
  finished_quantity      integer not null default 0 check (finished_quantity >= 0),
  total_quantity         integer generated always as (raw_material_quantity + semi_finished_quantity + finished_quantity) stored,
  remarks                text not null default '',
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint workshop_misc_materials_stock_out_has_quantity
    check (raw_material_quantity + semi_finished_quantity + finished_quantity > 0)
);

comment on table public.workshop_misc_materials_stock_out is '车间杂项材料出库流水';
comment on column public.workshop_misc_materials_stock_out.inventory_id is '关联材料库存 ID';
comment on column public.workshop_misc_materials_stock_out.raw_material_quantity is '原材料出库数量';
comment on column public.workshop_misc_materials_stock_out.semi_finished_quantity is '半成品出库数量';
comment on column public.workshop_misc_materials_stock_out.finished_quantity is '成品出库数量';
comment on column public.workshop_misc_materials_stock_out.total_quantity is '出库合计';

create index idx_workshop_misc_materials_stock_out_created_at_desc
  on public.workshop_misc_materials_stock_out (created_at desc);
create index idx_workshop_misc_materials_stock_out_inventory_id
  on public.workshop_misc_materials_stock_out (inventory_id);

create trigger update_workshop_misc_materials_stock_out_updated_at
before update on public.workshop_misc_materials_stock_out
for each row execute function public.update_updated_at_column();

create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.workshop_misc_materials_stock_out
for each row execute function public.prevent_viewer_dml();

-- 快照由数据库填写，客户端不能伪造材料资料。扣减库存与流水处于同一事务。
create function public.handle_workshop_misc_materials_stock_out()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_raw integer;
  v_semi integer;
  v_finished integer;
begin
  if tg_op = 'INSERT' then
    select model, customer_model, specification, category,
           raw_material_quantity, semi_finished_quantity, finished_quantity
      into new.model, new.customer_model, new.specification, new.category,
           v_raw, v_semi, v_finished
    from public.workshop_misc_materials_inventory
    where id = new.inventory_id
    for update;

    if not found then
      raise exception '材料库存不存在，无法出库';
    end if;

    if v_raw < new.raw_material_quantity then
      raise exception '当前原材料库存不足，无法出库';
    end if;
    if v_semi < new.semi_finished_quantity then
      raise exception '当前半成品库存不足，无法出库';
    end if;
    if v_finished < new.finished_quantity then
      raise exception '当前成品库存不足，无法出库';
    end if;

    update public.workshop_misc_materials_inventory
    set raw_material_quantity = raw_material_quantity - new.raw_material_quantity,
        semi_finished_quantity = semi_finished_quantity - new.semi_finished_quantity,
        finished_quantity = finished_quantity - new.finished_quantity
    where id = new.inventory_id;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    if (new.id, new.inventory_id, new.model, new.customer_model, new.specification, new.category,
        new.raw_material_quantity, new.semi_finished_quantity, new.finished_quantity, new.created_at)
       is distinct from
       (old.id, old.inventory_id, old.model, old.customer_model, old.specification, old.category,
        old.raw_material_quantity, old.semi_finished_quantity, old.finished_quantity, old.created_at) then
      raise exception '出库记录仅允许修改备注';
    end if;
    return new;
  end if;

  update public.workshop_misc_materials_inventory
  set raw_material_quantity = raw_material_quantity + old.raw_material_quantity,
      semi_finished_quantity = semi_finished_quantity + old.semi_finished_quantity,
      finished_quantity = finished_quantity + old.finished_quantity
  where id = old.inventory_id;

  if not found then
    raise exception '材料库存不存在，无法回补库存';
  end if;
  return old;
end;
$$;

revoke all on function public.handle_workshop_misc_materials_stock_out() from public;

create trigger workshop_misc_materials_stock_out_apply
before insert or update or delete on public.workshop_misc_materials_stock_out
for each row execute function public.handle_workshop_misc_materials_stock_out();

-- 5. 库存调整流水：库存页编辑、Excel 导入、详情抽屉调整等直接改数时写入
--    出入库单引起的库存变化已有流水，不重复记录；审计记录不设外键，资料删除后保留
create table public.workshop_misc_materials_inventory_adjustments (
  id                   uuid primary key default gen_random_uuid(),
  inventory_id         uuid not null,
  model                text not null default '',
  customer_model       text not null default '',
  specification        text not null default '',
  category             text not null default '',
  raw_material_before  integer not null,
  raw_material_after   integer not null,
  raw_material_diff    integer generated always as (raw_material_after - raw_material_before) stored,
  semi_finished_before integer not null,
  semi_finished_after  integer not null,
  semi_finished_diff   integer generated always as (semi_finished_after - semi_finished_before) stored,
  finished_before      integer not null,
  finished_after       integer not null,
  finished_diff        integer generated always as (finished_after - finished_before) stored,
  total_before         integer generated always as (raw_material_before + semi_finished_before + finished_before) stored,
  total_after          integer generated always as (raw_material_after + semi_finished_after + finished_after) stored,
  total_difference     integer generated always as ((raw_material_after + semi_finished_after + finished_after) - (raw_material_before + semi_finished_before + finished_before)) stored,
  remarks              text not null default '',
  operator_name        text not null default '',
  created_at           timestamptz not null default now()
);

comment on table public.workshop_misc_materials_inventory_adjustments is '车间杂项材料库存调整流水（直接改数时由触发器写入）';
comment on column public.workshop_misc_materials_inventory_adjustments.inventory_id is '材料库存行 ID';
comment on column public.workshop_misc_materials_inventory_adjustments.total_difference is '合计差额 = 调整后合计 - 调整前合计';
comment on column public.workshop_misc_materials_inventory_adjustments.operator_name is '操作人姓名快照，非员工账号或后台操作时为空';

create index idx_workshop_misc_materials_adjustments_inventory_created_at
  on public.workshop_misc_materials_inventory_adjustments (inventory_id, created_at desc);
create index idx_workshop_misc_materials_adjustments_created_at
  on public.workshop_misc_materials_inventory_adjustments (created_at);

create function public.record_workshop_misc_materials_inventory_adjustment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 出入库单在自己的触发器里改库存（深度 2），已有流水
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  insert into public.workshop_misc_materials_inventory_adjustments (
    inventory_id, model, customer_model, specification, category,
    raw_material_before, raw_material_after,
    semi_finished_before, semi_finished_after,
    finished_before, finished_after,
    remarks, operator_name
  )
  values (
    new.id,
    new.model,
    new.customer_model,
    new.specification,
    new.category,
    old.raw_material_quantity,
    new.raw_material_quantity,
    old.semi_finished_quantity,
    new.semi_finished_quantity,
    old.finished_quantity,
    new.finished_quantity,
    new.remarks,
    coalesce(
      (select e.name from public.employees e where e.auth_user_id = auth.uid() limit 1),
      ''
    )
  );

  return null;
end;
$$;

revoke all on function public.record_workshop_misc_materials_inventory_adjustment() from public;

create trigger workshop_misc_materials_inventory_record_adjustment
after update of raw_material_quantity, semi_finished_quantity, finished_quantity
  on public.workshop_misc_materials_inventory
for each row
when (
  old.raw_material_quantity is distinct from new.raw_material_quantity
  or old.semi_finished_quantity is distinct from new.semi_finished_quantity
  or old.finished_quantity is distinct from new.finished_quantity
)
execute function public.record_workshop_misc_materials_inventory_adjustment();

-- 6. 表权限与 RLS
alter table public.workshop_misc_materials_data enable row level security;
alter table public.workshop_misc_materials_inventory enable row level security;
alter table public.workshop_misc_materials_stock_in enable row level security;
alter table public.workshop_misc_materials_stock_out enable row level security;
alter table public.workshop_misc_materials_inventory_adjustments enable row level security;

revoke all on public.workshop_misc_materials_data from anon, authenticated;
revoke all on public.workshop_misc_materials_inventory from anon, authenticated;
revoke all on public.workshop_misc_materials_stock_in from anon, authenticated;
revoke all on public.workshop_misc_materials_stock_out from anon, authenticated;
revoke all on public.workshop_misc_materials_inventory_adjustments from anon, authenticated;

grant select, insert, update, delete on public.workshop_misc_materials_data to authenticated;
grant select, insert, update, delete on public.workshop_misc_materials_inventory to authenticated;
grant select, insert, update, delete on public.workshop_misc_materials_stock_in to authenticated;
grant select, insert, update, delete on public.workshop_misc_materials_stock_out to authenticated;
grant select on public.workshop_misc_materials_inventory_adjustments to authenticated;

create policy "Workshop misc materials data admin all"
on public.workshop_misc_materials_data for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Workshop misc materials data permission rw"
on public.workshop_misc_materials_data for all to authenticated
using (public.current_user_has_permission('page:workshop-misc-materials-data'))
with check (public.current_user_has_permission('page:workshop-misc-materials-data'));

create policy "Workshop misc materials inventory admin all"
on public.workshop_misc_materials_inventory for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Workshop misc materials inventory permission rw"
on public.workshop_misc_materials_inventory for all to authenticated
using (public.current_user_has_permission('page:workshop-misc-materials-inventory'))
with check (public.current_user_has_permission('page:workshop-misc-materials-inventory'));

create policy "Workshop misc materials inventory select for stock in"
on public.workshop_misc_materials_inventory for select to authenticated
using (public.current_user_has_permission('page:workshop-misc-materials-stock-in'));

create policy "Workshop misc materials inventory select for stock out"
on public.workshop_misc_materials_inventory for select to authenticated
using (public.current_user_has_permission('page:workshop-misc-materials-stock-out'));

create policy "Workshop misc materials stock in admin all"
on public.workshop_misc_materials_stock_in for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Workshop misc materials stock in permission rw"
on public.workshop_misc_materials_stock_in for all to authenticated
using (public.current_user_has_permission('page:workshop-misc-materials-stock-in'))
with check (public.current_user_has_permission('page:workshop-misc-materials-stock-in'));

create policy "Workshop misc materials stock out admin all"
on public.workshop_misc_materials_stock_out for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Workshop misc materials stock out permission rw"
on public.workshop_misc_materials_stock_out for all to authenticated
using (public.current_user_has_permission('page:workshop-misc-materials-stock-out'))
with check (public.current_user_has_permission('page:workshop-misc-materials-stock-out'));

create policy "Workshop misc materials adjustments select"
on public.workshop_misc_materials_inventory_adjustments for select to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:workshop-misc-materials-inventory')
);

-- 7. 历史类别联想
create function public.get_workshop_misc_materials_categories()
returns table (
  category text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (
    public.is_admin()
    or public.current_user_has_permission('page:workshop-misc-materials-data')
    or public.current_user_has_permission('page:workshop-misc-materials-inventory')
    or public.current_user_has_permission('page:workshop-misc-materials-stock-in')
    or public.current_user_has_permission('page:workshop-misc-materials-stock-out')
    or public.current_user_has_permission('page:workshop-misc-materials-monthly-report')
  ) then
    raise exception '无权查看车间杂项材料类别' using errcode = '42501';
  end if;

  return query
  select distinct d.category
  from public.workshop_misc_materials_data d
  where btrim(d.category) <> ''
  order by d.category;
end;
$$;

comment on function public.get_workshop_misc_materials_categories() is
  '返回车间杂项材料资料中已填写的非空去重类别列表，供筛选和录入联想';

revoke all on function public.get_workshop_misc_materials_categories() from public, anon;
grant execute on function public.get_workshop_misc_materials_categories() to authenticated;

-- 8. 月度报表
--   支持按维度筛选：total（合计）/ raw（原材料）/ semi（半成品）/ finished（成品）
--   上月结余 = 当前库存 - 月初起（入库 - 出库 + 调整）合计
--   月末结存 = 上月结余 + 本月入库 - 本月出库 + 本月调整
create function public.get_workshop_misc_materials_monthly_report(
  p_month date,
  p_stage text default 'total'
)
returns table (
  inventory_id uuid,
  model text,
  customer_model text,
  specification text,
  category text,
  opening_quantity bigint,
  stock_in_quantity bigint,
  stock_out_quantity bigint,
  stock_adjust_quantity bigint,
  closing_quantity bigint,
  current_quantity bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_start timestamptz;
  v_end timestamptz;
begin
  if not (
    public.is_admin()
    or public.current_user_has_permission('page:workshop-misc-materials-monthly-report')
  ) then
    raise exception '无权查看车间杂项材料月度报表' using errcode = '42501';
  end if;

  if p_month is null then
    raise exception '请选择报表月份' using errcode = '22004';
  end if;

  if p_stage is null or p_stage not in ('total', 'raw', 'semi', 'finished') then
    raise exception '不支持的统计维度' using errcode = '22023';
  end if;

  v_start := date_trunc('month', p_month)::timestamp at time zone 'Asia/Shanghai';
  v_end := (date_trunc('month', p_month) + interval '1 month')::timestamp at time zone 'Asia/Shanghai';

  return query
  with movements as (
    select
      s.inventory_id,
      (case p_stage
        when 'raw' then s.raw_material_quantity
        when 'semi' then s.semi_finished_quantity
        when 'finished' then s.finished_quantity
        else s.total_quantity
      end)::bigint as quantity,
      'in'::text as kind,
      s.created_at
    from public.workshop_misc_materials_stock_in s
    where s.created_at >= v_start
    union all
    select
      s.inventory_id,
      (case p_stage
        when 'raw' then s.raw_material_quantity
        when 'semi' then s.semi_finished_quantity
        when 'finished' then s.finished_quantity
        else s.total_quantity
      end)::bigint,
      'out',
      s.created_at
    from public.workshop_misc_materials_stock_out s
    where s.created_at >= v_start
    union all
    select
      a.inventory_id,
      (case p_stage
        when 'raw' then a.raw_material_diff
        when 'semi' then a.semi_finished_diff
        when 'finished' then a.finished_diff
        else a.total_difference
      end)::bigint,
      'adjust',
      a.created_at
    from public.workshop_misc_materials_inventory_adjustments a
    where a.created_at >= v_start
  ),
  movement_totals as (
    select
      m.inventory_id,
      coalesce(sum(case when m.kind = 'out' then -m.quantity else m.quantity end), 0)::bigint as net_since_start,
      coalesce(sum(m.quantity) filter (where m.kind = 'in' and m.created_at < v_end), 0)::bigint as month_in,
      coalesce(sum(m.quantity) filter (where m.kind = 'out' and m.created_at < v_end), 0)::bigint as month_out,
      coalesce(sum(m.quantity) filter (where m.kind = 'adjust' and m.created_at < v_end), 0)::bigint as month_adjust
    from movements m
    group by m.inventory_id
  ),
  base_inventory as (
    select
      i.id,
      i.model,
      i.customer_model,
      i.specification,
      i.category,
      (case p_stage
        when 'raw' then i.raw_material_quantity
        when 'semi' then i.semi_finished_quantity
        when 'finished' then i.finished_quantity
        else i.total_quantity
      end)::bigint as stage_current_quantity
    from public.workshop_misc_materials_inventory i
  )
  select
    i.id,
    i.model,
    i.customer_model,
    i.specification,
    i.category,
    i.stage_current_quantity - coalesce(t.net_since_start, 0) as opening_quantity,
    coalesce(t.month_in, 0) as stock_in_quantity,
    coalesce(t.month_out, 0) as stock_out_quantity,
    coalesce(t.month_adjust, 0) as stock_adjust_quantity,
    i.stage_current_quantity - coalesce(t.net_since_start, 0)
      + coalesce(t.month_in, 0) - coalesce(t.month_out, 0)
      + coalesce(t.month_adjust, 0) as closing_quantity,
    i.stage_current_quantity as current_quantity
  from base_inventory i
  left join movement_totals t on t.inventory_id = i.id
  order by i.model, i.customer_model, i.specification, i.category;
end;
$$;

comment on function public.get_workshop_misc_materials_monthly_report(date, text) is
  '车间杂项材料月度库存报表：按 Asia/Shanghai 月份与维度（total/raw/semi/finished）返回上月结余、本月入库、本月出库、本月调整、月末结存';

revoke all on function public.get_workshop_misc_materials_monthly_report(date, text) from public, anon;
grant execute on function public.get_workshop_misc_materials_monthly_report(date, text) to authenticated;

-- 9. 权限
insert into public.permissions (key, scope, module, surface, label)
values
  ('nav:workshop-misc-materials', 'nav', 'workshop-misc-materials', 'pc', '车间杂项材料库存菜单分组'),
  ('page:workshop-misc-materials-data', 'page', 'workshop-misc-materials', 'pc', '车间杂项材料资料'),
  ('page:workshop-misc-materials-stock-in', 'page', 'workshop-misc-materials', 'pc', '车间杂项材料入库'),
  ('page:workshop-misc-materials-stock-out', 'page', 'workshop-misc-materials', 'pc', '车间杂项材料出库'),
  ('page:workshop-misc-materials-inventory', 'page', 'workshop-misc-materials', 'pc', '车间杂项材料库存'),
  ('page:workshop-misc-materials-monthly-report', 'page', 'workshop-misc-materials', 'pc', '车间杂项材料月度报表')
on conflict (key) do nothing;
