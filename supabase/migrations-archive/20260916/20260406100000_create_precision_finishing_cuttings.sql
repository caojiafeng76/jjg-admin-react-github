create table if not exists public.precision_finishing_cuttings (
  id uuid primary key default gen_random_uuid(),
  project_no text not null,
  customer text,
  product_model text,
  length_mm numeric,
  customer_model text,
  long_material_length_mm numeric not null check (long_material_length_mm > 0),
  long_material_quantity integer not null check (long_material_quantity > 0),
  raw_material_defect_count integer not null default 0 check (raw_material_defect_count >= 0),
  processing_defect_count integer not null default 0 check (processing_defect_count >= 0),
  defect_reason text,
  transfer_quantity integer not null check (transfer_quantity > 0),
  operator_employee_id uuid not null references public.employees (id),
  operator_employee_ids uuid [] not null default '{}'::uuid [],
  operator_names text [] not null default '{}'::text [],
  target_workshop text not null check (
    target_workshop in (
      '挤压',
      '时效',
      '大氧化',
      '小氧化',
      '精切',
      '精加工',
      '喷涂',
      '抛光',
      '包装',
      '仓库'
    )
  ),
  recipient_name text not null,
  inspector_name text,
  uploaded_by_name text,
  remark text,
  is_audited boolean not null default false,
  audited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint precision_finishing_cuttings_operator_employee_ids_not_empty check (
    coalesce(array_length(operator_employee_ids, 1), 0) > 0
  ),
  constraint precision_finishing_cuttings_operator_arrays_same_length check (
    coalesce(array_length(operator_employee_ids, 1), 0) = coalesce(array_length(operator_names, 1), 0)
  ),
  constraint precision_finishing_cuttings_primary_operator_matches_first check (
    operator_employee_id = operator_employee_ids [1]
  )
);
comment on table public.precision_finishing_cuttings is '精加工切割单';
comment on column public.precision_finishing_cuttings.project_no is '项目号';
comment on column public.precision_finishing_cuttings.customer is '客户快照';
comment on column public.precision_finishing_cuttings.product_model is '型号快照';
comment on column public.precision_finishing_cuttings.length_mm is '长度快照';
comment on column public.precision_finishing_cuttings.customer_model is '客户型号快照';
comment on column public.precision_finishing_cuttings.long_material_length_mm is '长料长度';
comment on column public.precision_finishing_cuttings.long_material_quantity is '长料数量';
comment on column public.precision_finishing_cuttings.raw_material_defect_count is '原料不良数';
comment on column public.precision_finishing_cuttings.processing_defect_count is '加工不良数';
comment on column public.precision_finishing_cuttings.defect_reason is '不良原因';
comment on column public.precision_finishing_cuttings.transfer_quantity is '转移数量';
comment on column public.precision_finishing_cuttings.operator_employee_id is '主操作人员工ID';
comment on column public.precision_finishing_cuttings.operator_employee_ids is '操作人员工ID列表';
comment on column public.precision_finishing_cuttings.operator_names is '操作人姓名列表';
comment on column public.precision_finishing_cuttings.target_workshop is '接收车间';
comment on column public.precision_finishing_cuttings.recipient_name is '接收人';
comment on column public.precision_finishing_cuttings.inspector_name is '检验人';
comment on column public.precision_finishing_cuttings.uploaded_by_name is '数据上传';
comment on column public.precision_finishing_cuttings.remark is '备注';
comment on column public.precision_finishing_cuttings.is_audited is '是否已审核';
comment on column public.precision_finishing_cuttings.audited_at is '审核时间';
create index if not exists idx_precision_finishing_cuttings_project_no on public.precision_finishing_cuttings (project_no);
create index if not exists idx_precision_finishing_cuttings_target_workshop on public.precision_finishing_cuttings (target_workshop);
create index if not exists idx_precision_finishing_cuttings_created_at_desc on public.precision_finishing_cuttings (created_at desc);
create index if not exists idx_precision_finishing_cuttings_operator_employee_ids_gin on public.precision_finishing_cuttings using gin (operator_employee_ids);
create or replace function public.sync_precision_finishing_cutting_audit_fields() returns trigger language plpgsql as $$ begin if new.is_audited is true then if tg_op = 'INSERT' then new.audited_at = coalesce(new.audited_at, now());
elsif old.is_audited is distinct
from new.is_audited then new.audited_at = coalesce(new.audited_at, now());
end if;
else new.audited_at = null;
end if;
return new;
end;
$$;
drop trigger if exists precision_finishing_cuttings_set_updated_at on public.precision_finishing_cuttings;
create trigger precision_finishing_cuttings_set_updated_at before
update on public.precision_finishing_cuttings for each row execute function public.update_updated_at_column();
drop trigger if exists sync_precision_finishing_cutting_audit_fields on public.precision_finishing_cuttings;
create trigger sync_precision_finishing_cutting_audit_fields before
insert
  or
update of is_audited,
  audited_at on public.precision_finishing_cuttings for each row execute function public.sync_precision_finishing_cutting_audit_fields();
alter table public.precision_finishing_cuttings enable row level security;
drop policy if exists "Precision finishing cuttings admin all" on public.precision_finishing_cuttings;
create policy "Precision finishing cuttings admin all" on public.precision_finishing_cuttings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Precision finishing cuttings employee select scoped" on public.precision_finishing_cuttings;
create policy "Precision finishing cuttings employee select scoped" on public.precision_finishing_cuttings for
select to authenticated using (
    public.is_team_leader()
    or public.current_employee_id() = any (operator_employee_ids)
  );
drop policy if exists "Precision finishing cuttings employee insert scoped" on public.precision_finishing_cuttings;
create policy "Precision finishing cuttings employee insert scoped" on public.precision_finishing_cuttings for
insert to authenticated with check (
    coalesce(is_audited, false) = false
    and audited_at is null
    and (
      public.is_team_leader()
      or (
        operator_employee_id = public.current_employee_id()
        and operator_employee_ids = array [public.current_employee_id()]::uuid []
      )
    )
  );
drop policy if exists "Precision finishing cuttings employee update scoped" on public.precision_finishing_cuttings;
create policy "Precision finishing cuttings employee update scoped" on public.precision_finishing_cuttings for
update to authenticated using (
    coalesce(is_audited, false) = false
    and (
      public.is_team_leader()
      or public.current_employee_id() = any (operator_employee_ids)
    )
  ) with check (
    coalesce(is_audited, false) = false
    and (
      public.is_team_leader()
      or (
        operator_employee_id = public.current_employee_id()
        and operator_employee_ids = array [public.current_employee_id()]::uuid []
      )
    )
  );