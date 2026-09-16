alter table public.material_transfers
add column if not exists operator_employee_ids uuid [] not null default '{}'::uuid [],
  add column if not exists operator_names text [] not null default '{}'::text [];
comment on column public.material_transfers.operator_employee_id is '主操作人员工ID（兼容字段，对应 operator_employee_ids 第一项）';
comment on column public.material_transfers.operator_employee_ids is '操作人员工ID列表';
comment on column public.material_transfers.operator_names is '操作人姓名列表';
update public.material_transfers mt
set operator_employee_ids = array [mt.operator_employee_id],
  operator_names = array [e.name]
from public.employees e
where e.id = mt.operator_employee_id
  and coalesce(array_length(mt.operator_employee_ids, 1), 0) = 0;
alter table public.material_transfers drop constraint if exists material_transfers_operator_employee_ids_not_empty,
  drop constraint if exists material_transfers_operator_arrays_same_length,
  add constraint material_transfers_operator_employee_ids_not_empty check (
    coalesce(array_length(operator_employee_ids, 1), 0) > 0
  ),
  add constraint material_transfers_operator_arrays_same_length check (
    coalesce(array_length(operator_employee_ids, 1), 0) = coalesce(array_length(operator_names, 1), 0)
  );
create index if not exists idx_material_transfers_operator_employee_ids_gin on public.material_transfers using gin (operator_employee_ids);
drop policy if exists "Material transfers employee select own" on public.material_transfers;
drop policy if exists "Material transfers employee insert own" on public.material_transfers;
drop policy if exists "Material transfers employee update own" on public.material_transfers;
create policy "Material transfers employee select own" on public.material_transfers for
select to authenticated using (
    public.is_team_leader()
    or (
      public.current_employee_id() is not null
      and operator_employee_ids @> array [public.current_employee_id()]
    )
  );
create policy "Material transfers employee insert own" on public.material_transfers for
insert to authenticated with check (
    (
      public.is_team_leader()
      or (
        public.current_employee_id() is not null
        and operator_employee_ids @> array [public.current_employee_id()]
      )
    )
    and coalesce(is_audited, false) = false
    and audited_at is null
  );
create policy "Material transfers employee update own" on public.material_transfers for
update to authenticated using (
    (
      public.is_team_leader()
      or (
        public.current_employee_id() is not null
        and operator_employee_ids @> array [public.current_employee_id()]
      )
    )
    and coalesce(is_audited, false) = false
  ) with check (
    (
      public.is_team_leader()
      or (
        public.current_employee_id() is not null
        and operator_employee_ids @> array [public.current_employee_id()]
      )
    )
    and coalesce(is_audited, false) = false
  );