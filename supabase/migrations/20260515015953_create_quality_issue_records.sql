create table if not exists public.quality_issue_records (
  id uuid primary key default gen_random_uuid(),
  production_date date not null,
  reporter_employee_id uuid not null references public.employees (id) on update cascade on delete restrict,
  project_no text not null,
  customer text,
  product_model text,
  length_mm numeric,
  customer_model text,
  order_quantity numeric,
  processed_quantity integer not null default 0,
  qualified_quantity integer not null default 0,
  defective_quantity integer not null default 0,
  defect_rate numeric(8, 2) generated always as (
    case
      when processed_quantity > 0 then round(defective_quantity::numeric * 100 / processed_quantity::numeric, 2)
      else 0
    end
  ) stored,
  quality_issue text not null default '',
  cause text not null default '',
  defective_handling_result text not null default '',
  issue_type text not null default '',
  responsibility_handling_result text not null default '',
  operator_name text not null default '',
  shift_leader_name text not null default '',
  inspector_name text not null default '',
  audit_status text not null default 'pending',
  remark text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint quality_issue_records_project_no_not_blank check (btrim(project_no) <> ''),
  constraint quality_issue_records_processed_quantity_non_negative check (processed_quantity >= 0),
  constraint quality_issue_records_qualified_quantity_non_negative check (qualified_quantity >= 0),
  constraint quality_issue_records_defective_quantity_non_negative check (defective_quantity >= 0),
  constraint quality_issue_records_issue_type_valid check (
    issue_type in ('', '尺寸', '表面伤', '表面毛刺')
  ),
  constraint quality_issue_records_audit_status_valid check (
    audit_status in ('pending', 'approved', 'rejected')
  )
);

comment on table public.quality_issue_records is '质量问题记录单';
comment on column public.quality_issue_records.production_date is '生产日期';
comment on column public.quality_issue_records.reporter_employee_id is '上报人员工ID';
comment on column public.quality_issue_records.project_no is '项目号';
comment on column public.quality_issue_records.customer is '客户快照';
comment on column public.quality_issue_records.product_model is '型号快照';
comment on column public.quality_issue_records.length_mm is '长度快照';
comment on column public.quality_issue_records.customer_model is '客户型号快照';
comment on column public.quality_issue_records.order_quantity is '订单数量快照';
comment on column public.quality_issue_records.processed_quantity is '加工数量';
comment on column public.quality_issue_records.qualified_quantity is '合格数量';
comment on column public.quality_issue_records.defective_quantity is '不良数量';
comment on column public.quality_issue_records.defect_rate is '不良率百分比';
comment on column public.quality_issue_records.quality_issue is '质量问题';
comment on column public.quality_issue_records.cause is '造成原因';
comment on column public.quality_issue_records.defective_handling_result is '不良品处理结果';
comment on column public.quality_issue_records.issue_type is '问题类型';
comment on column public.quality_issue_records.responsibility_handling_result is '责任处理结果';
comment on column public.quality_issue_records.operator_name is '操作人';
comment on column public.quality_issue_records.shift_leader_name is '当班负责人';
comment on column public.quality_issue_records.inspector_name is '检验人';
comment on column public.quality_issue_records.audit_status is '审核状态';
comment on column public.quality_issue_records.remark is '备注';

create index if not exists idx_quality_issue_records_production_date_desc
on public.quality_issue_records (production_date desc);

create index if not exists idx_quality_issue_records_project_no
on public.quality_issue_records (project_no);

create index if not exists idx_quality_issue_records_reporter_employee_id
on public.quality_issue_records (reporter_employee_id);

create index if not exists idx_quality_issue_records_audit_status
on public.quality_issue_records (audit_status);

create index if not exists idx_quality_issue_records_updated_at_desc
on public.quality_issue_records (updated_at desc);

drop trigger if exists update_quality_issue_records_updated_at on public.quality_issue_records;
create trigger update_quality_issue_records_updated_at before
update on public.quality_issue_records for each row execute function public.update_updated_at_column();

insert into public.permissions (key, scope, module, surface, label)
values
  ('nav:quality', 'nav', 'quality', 'pc', '质量菜单分组'),
  ('page:quality-issue-record', 'page', 'quality', 'pc', '质量问题记录单')
on conflict (key) do nothing;

alter table public.quality_issue_records enable row level security;

drop policy if exists "Quality issue records permission rw" on public.quality_issue_records;
create policy "Quality issue records permission rw"
on public.quality_issue_records
for all
to authenticated
using (public.current_user_has_permission('page:quality-issue-record'))
with check (public.current_user_has_permission('page:quality-issue-record'));
