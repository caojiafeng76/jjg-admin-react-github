create table if not exists public.extrusion_productions (
  id uuid primary key default gen_random_uuid(),
  production_date date not null,
  machine_id uuid not null references public.machine_equipment_maintenances (id) on update cascade on delete restrict,
  shift text not null check (shift in ('白班', '夜班')),
  shift_leader_employee_id uuid not null references public.employees (id) on update cascade on delete restrict,
  operator_employee_id uuid not null references public.employees (id) on update cascade on delete restrict,
  inspector_employee_id uuid references public.employees (id) on update cascade on delete restrict,
  uploaded_by_name text,
  remark text,
  is_audited boolean not null default false,
  audited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint extrusion_productions_unique_schedule unique (
    production_date,
    machine_id,
    shift
  )
);

comment on table public.extrusion_productions is '挤压生产单主表';
comment on column public.extrusion_productions.production_date is '生产日期';
comment on column public.extrusion_productions.machine_id is '设备ID';
comment on column public.extrusion_productions.shift is '班别';
comment on column public.extrusion_productions.shift_leader_employee_id is '班组长员工ID';
comment on column public.extrusion_productions.operator_employee_id is '操作人员工ID';
comment on column public.extrusion_productions.inspector_employee_id is '检验员工ID';
comment on column public.extrusion_productions.uploaded_by_name is '上传人姓名快照';
comment on column public.extrusion_productions.remark is '备注';
comment on column public.extrusion_productions.is_audited is '是否已审核';
comment on column public.extrusion_productions.audited_at is '审核时间';

create index if not exists idx_extrusion_productions_production_date_desc
  on public.extrusion_productions (production_date desc);
create index if not exists idx_extrusion_productions_machine_id
  on public.extrusion_productions (machine_id);
create index if not exists idx_extrusion_productions_operator_employee_id
  on public.extrusion_productions (operator_employee_id);

create table if not exists public.extrusion_production_items (
  id uuid primary key default gen_random_uuid(),
  extrusion_production_id uuid not null references public.extrusion_productions (id) on update cascade on delete cascade,
  sort_order integer not null default 0,
  project_no text not null,
  product_model text,
  customer text,
  customer_model text,
  material_name text,
  order_length_mm numeric not null check (order_length_mm > 0),
  theoretical_unit_weight_kg_per_meter numeric not null check (theoretical_unit_weight_kg_per_meter > 0),
  die_no text,
  billet_diameter_mm numeric not null check (billet_diameter_mm > 0),
  billet_length_mm numeric not null check (billet_length_mm > 0),
  billet_quantity integer not null check (billet_quantity > 0),
  billet_input_weight_kg numeric not null check (billet_input_weight_kg > 0),
  actual_output_length_mm numeric not null check (actual_output_length_mm > 0),
  actual_unit_weight_kg numeric not null check (actual_unit_weight_kg > 0),
  actual_quantity integer not null check (actual_quantity >= 0),
  theoretical_output_count integer not null default 0 check (theoretical_output_count >= 0),
  theoretical_output_weight_kg numeric not null default 0 check (theoretical_output_weight_kg >= 0),
  actual_output_weight_kg numeric not null default 0 check (actual_output_weight_kg >= 0),
  scrap_weight_kg numeric not null default 0 check (scrap_weight_kg >= 0),
  tailing_weight_kg numeric not null default 0 check (tailing_weight_kg >= 0),
  material_yield numeric not null default 0 check (material_yield >= 0),
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.extrusion_production_items is '挤压生产单明细';
comment on column public.extrusion_production_items.sort_order is '明细排序';
comment on column public.extrusion_production_items.project_no is '项目号';
comment on column public.extrusion_production_items.product_model is '型号快照';
comment on column public.extrusion_production_items.customer is '客户快照';
comment on column public.extrusion_production_items.customer_model is '客户型号快照';
comment on column public.extrusion_production_items.material_name is '材质快照';
comment on column public.extrusion_production_items.order_length_mm is '订单要求长度(mm)';
comment on column public.extrusion_production_items.theoretical_unit_weight_kg_per_meter is '理论米重(kg/m)';
comment on column public.extrusion_production_items.die_no is '模具号';
comment on column public.extrusion_production_items.billet_diameter_mm is '铝棒直径(mm)';
comment on column public.extrusion_production_items.billet_length_mm is '铝棒长度(mm)';
comment on column public.extrusion_production_items.billet_quantity is '铝棒数量';
comment on column public.extrusion_production_items.billet_input_weight_kg is '铝棒投入重量(kg)';
comment on column public.extrusion_production_items.actual_output_length_mm is '实际产出长度(mm)';
comment on column public.extrusion_production_items.actual_unit_weight_kg is '实际支重(kg/支)';
comment on column public.extrusion_production_items.actual_quantity is '实际产出数量';
comment on column public.extrusion_production_items.theoretical_output_count is '理论支数';
comment on column public.extrusion_production_items.theoretical_output_weight_kg is '理论支重(kg)';
comment on column public.extrusion_production_items.actual_output_weight_kg is '实际产出重量(kg)';
comment on column public.extrusion_production_items.scrap_weight_kg is '废料重量(kg)';
comment on column public.extrusion_production_items.tailing_weight_kg is '压余重量(kg)';
comment on column public.extrusion_production_items.material_yield is '成材率';
comment on column public.extrusion_production_items.remark is '备注';

create index if not exists idx_extrusion_production_items_extrusion_production_id
  on public.extrusion_production_items (extrusion_production_id);
create index if not exists idx_extrusion_production_items_project_no
  on public.extrusion_production_items (project_no);
create index if not exists idx_extrusion_production_items_project_no_sort_order
  on public.extrusion_production_items (project_no, sort_order);

create or replace function public.sync_extrusion_production_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if new.is_audited is true then
    if tg_op = 'INSERT' then
      new.audited_at = coalesce(new.audited_at, now());
    elsif old.is_audited is distinct from new.is_audited then
      new.audited_at = coalesce(new.audited_at, now());
    end if;
  else
    new.audited_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists extrusion_productions_set_updated_at on public.extrusion_productions;
create trigger extrusion_productions_set_updated_at
before update on public.extrusion_productions
for each row
execute function public.update_updated_at_column();

drop trigger if exists extrusion_production_items_set_updated_at on public.extrusion_production_items;
create trigger extrusion_production_items_set_updated_at
before update on public.extrusion_production_items
for each row
execute function public.update_updated_at_column();

drop trigger if exists sync_extrusion_production_audit_fields on public.extrusion_productions;
create trigger sync_extrusion_production_audit_fields
before insert or update of is_audited, audited_at
on public.extrusion_productions
for each row
execute function public.sync_extrusion_production_audit_fields();

alter table public.extrusion_productions enable row level security;
alter table public.extrusion_production_items enable row level security;

drop policy if exists "Extrusion productions admin all" on public.extrusion_productions;
create policy "Extrusion productions admin all"
on public.extrusion_productions
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Extrusion production items admin all" on public.extrusion_production_items;
create policy "Extrusion production items admin all"
on public.extrusion_production_items
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "extrusion_productions permission rw" on public.extrusion_productions;
create policy "extrusion_productions permission rw"
on public.extrusion_productions
for all to authenticated
using (public.current_user_has_permission('page:extrusion-production'))
with check (public.current_user_has_permission('page:extrusion-production'));

drop policy if exists "extrusion_production_items permission rw" on public.extrusion_production_items;
create policy "extrusion_production_items permission rw"
on public.extrusion_production_items
for all to authenticated
using (public.current_user_has_permission('page:extrusion-production'))
with check (public.current_user_has_permission('page:extrusion-production'));

insert into public.permissions (key, scope, module, surface, label, description)
values
  (
    'nav:extrusion-production',
    'nav',
    'extrusion-production',
    'pc',
    '挤压菜单分组',
    '控制 PC 端挤压生产模块菜单分组可见性'
  ),
  (
    'page:extrusion-production',
    'page',
    'extrusion-production',
    'pc',
    '挤压生产单',
    '控制挤压生产页面访问及对应数据表 RLS'
  ),
  (
    'feature:extrusion-production.create',
    'feature',
    'extrusion-production',
    'pc',
    '挤压生产单-新建',
    '控制挤压生产单新建入口'
  ),
  (
    'feature:extrusion-production.audit',
    'feature',
    'extrusion-production',
    'pc',
    '挤压生产单-审核',
    '控制挤压生产单审核入口'
  ),
  (
    'feature:extrusion-production.delete',
    'feature',
    'extrusion-production',
    'pc',
    '挤压生产单-删除',
    '控制挤压生产单删除入口'
  )
on conflict (key) do update
set
  scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label,
  description = excluded.description;

create or replace function public.upsert_extrusion_production(
  p_header jsonb,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_extrusion_production_id uuid;
  v_existing_id uuid;
  v_item jsonb;
begin
  if p_header is null or jsonb_typeof(p_header) <> 'object' then
    raise exception '挤压生产单表头不能为空';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '挤压生产单明细不能为空';
  end if;

  v_extrusion_production_id := nullif(p_header ->> 'id', '')::uuid;

  if v_extrusion_production_id is not null then
    select ep.id
      into v_existing_id
    from public.extrusion_productions ep
    where ep.id = v_extrusion_production_id
    for update;

    if v_existing_id is null then
      raise exception '挤压生产单不存在';
    end if;

    update public.extrusion_productions
    set
      production_date = (p_header ->> 'production_date')::date,
      machine_id = (p_header ->> 'machine_id')::uuid,
      shift = p_header ->> 'shift',
      shift_leader_employee_id = (p_header ->> 'shift_leader_employee_id')::uuid,
      operator_employee_id = (p_header ->> 'operator_employee_id')::uuid,
      inspector_employee_id = nullif(p_header ->> 'inspector_employee_id', '')::uuid,
      uploaded_by_name = nullif(p_header ->> 'uploaded_by_name', ''),
      remark = nullif(p_header ->> 'remark', ''),
      is_audited = coalesce((p_header ->> 'is_audited')::boolean, false),
      audited_at = nullif(p_header ->> 'audited_at', '')::timestamptz
    where id = v_extrusion_production_id;

    delete from public.extrusion_production_items
    where extrusion_production_id = v_extrusion_production_id;
  else
    insert into public.extrusion_productions (
      production_date,
      machine_id,
      shift,
      shift_leader_employee_id,
      operator_employee_id,
      inspector_employee_id,
      uploaded_by_name,
      remark,
      is_audited,
      audited_at
    )
    values (
      (p_header ->> 'production_date')::date,
      (p_header ->> 'machine_id')::uuid,
      p_header ->> 'shift',
      (p_header ->> 'shift_leader_employee_id')::uuid,
      (p_header ->> 'operator_employee_id')::uuid,
      nullif(p_header ->> 'inspector_employee_id', '')::uuid,
      nullif(p_header ->> 'uploaded_by_name', ''),
      nullif(p_header ->> 'remark', ''),
      coalesce((p_header ->> 'is_audited')::boolean, false),
      nullif(p_header ->> 'audited_at', '')::timestamptz
    )
    returning id into v_extrusion_production_id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.extrusion_production_items (
      extrusion_production_id,
      sort_order,
      project_no,
      product_model,
      customer,
      customer_model,
      material_name,
      order_length_mm,
      theoretical_unit_weight_kg_per_meter,
      die_no,
      billet_diameter_mm,
      billet_length_mm,
      billet_quantity,
      billet_input_weight_kg,
      actual_output_length_mm,
      actual_unit_weight_kg,
      actual_quantity,
      theoretical_output_count,
      theoretical_output_weight_kg,
      actual_output_weight_kg,
      scrap_weight_kg,
      tailing_weight_kg,
      material_yield,
      remark
    )
    values (
      v_extrusion_production_id,
      coalesce((v_item ->> 'sort_order')::integer, 0),
      v_item ->> 'project_no',
      nullif(v_item ->> 'product_model', ''),
      nullif(v_item ->> 'customer', ''),
      nullif(v_item ->> 'customer_model', ''),
      nullif(v_item ->> 'material_name', ''),
      (v_item ->> 'order_length_mm')::numeric,
      (v_item ->> 'theoretical_unit_weight_kg_per_meter')::numeric,
      nullif(v_item ->> 'die_no', ''),
      (v_item ->> 'billet_diameter_mm')::numeric,
      (v_item ->> 'billet_length_mm')::numeric,
      (v_item ->> 'billet_quantity')::integer,
      (v_item ->> 'billet_input_weight_kg')::numeric,
      (v_item ->> 'actual_output_length_mm')::numeric,
      (v_item ->> 'actual_unit_weight_kg')::numeric,
      coalesce((v_item ->> 'actual_quantity')::integer, 0),
      coalesce((v_item ->> 'theoretical_output_count')::integer, 0),
      coalesce((v_item ->> 'theoretical_output_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'actual_output_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'scrap_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'tailing_weight_kg')::numeric, 0),
      coalesce((v_item ->> 'material_yield')::numeric, 0),
      nullif(v_item ->> 'remark', '')
    );
  end loop;

  return v_extrusion_production_id;
end;
$$;

grant execute on function public.upsert_extrusion_production(jsonb, jsonb) to authenticated;
