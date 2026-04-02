create table if not exists public.precision_cutting_transfers (
  id uuid primary key default gen_random_uuid(),
  project_no text not null,
  customer text,
  product_model text,
  length_mm numeric,
  customer_model text,
  long_material_length_mm numeric not null check (long_material_length_mm > 0),
  long_material_quantity integer not null check (long_material_quantity > 0),
  transfer_quantity integer not null check (transfer_quantity > 0),
  operator_names text[] not null default '{}'::text[] check (
    coalesce(array_length(operator_names, 1), 0) > 0
    and operator_names <@ array['吴国忠', '蒋建祥', '姚利祥']::text[]
  ),
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
  shift_leader_name text,
  inspector_name text,
  uploaded_by_name text,
  remark text,
  is_audited boolean not null default false,
  audited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.precision_cutting_transfers is '精切转移单';
comment on column public.precision_cutting_transfers.project_no is '项目号';
comment on column public.precision_cutting_transfers.customer is '客户快照';
comment on column public.precision_cutting_transfers.product_model is '型号快照';
comment on column public.precision_cutting_transfers.length_mm is '长度快照';
comment on column public.precision_cutting_transfers.customer_model is '客户型号快照';
comment on column public.precision_cutting_transfers.long_material_length_mm is '长料长度';
comment on column public.precision_cutting_transfers.long_material_quantity is '长料数量';
comment on column public.precision_cutting_transfers.transfer_quantity is '转移数量';
comment on column public.precision_cutting_transfers.operator_names is '操作人姓名列表';
comment on column public.precision_cutting_transfers.target_workshop is '接收车间';
comment on column public.precision_cutting_transfers.recipient_name is '接收人';
comment on column public.precision_cutting_transfers.shift_leader_name is '当班负责人';
comment on column public.precision_cutting_transfers.inspector_name is '检验人';
comment on column public.precision_cutting_transfers.uploaded_by_name is '数据上传';
comment on column public.precision_cutting_transfers.remark is '备注';
comment on column public.precision_cutting_transfers.is_audited is '是否已审核';
comment on column public.precision_cutting_transfers.audited_at is '审核时间';

create index if not exists idx_precision_cutting_transfers_project_no
  on public.precision_cutting_transfers (project_no);
create index if not exists idx_precision_cutting_transfers_target_workshop
  on public.precision_cutting_transfers (target_workshop);
create index if not exists idx_precision_cutting_transfers_created_at_desc
  on public.precision_cutting_transfers (created_at desc);
create index if not exists idx_precision_cutting_transfers_operator_names_gin
  on public.precision_cutting_transfers using gin (operator_names);

create or replace function public.sync_precision_cutting_transfer_audit_fields()
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

drop trigger if exists precision_cutting_transfers_set_updated_at
  on public.precision_cutting_transfers;
create trigger precision_cutting_transfers_set_updated_at
before update on public.precision_cutting_transfers
for each row execute function public.update_updated_at_column();

drop trigger if exists sync_precision_cutting_transfer_audit_fields
  on public.precision_cutting_transfers;
create trigger sync_precision_cutting_transfer_audit_fields
before insert or update of is_audited, audited_at
on public.precision_cutting_transfers
for each row execute function public.sync_precision_cutting_transfer_audit_fields();

alter table public.precision_cutting_transfers enable row level security;

drop policy if exists "Precision cutting transfers admin all"
  on public.precision_cutting_transfers;
create policy "Precision cutting transfers admin all"
on public.precision_cutting_transfers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());