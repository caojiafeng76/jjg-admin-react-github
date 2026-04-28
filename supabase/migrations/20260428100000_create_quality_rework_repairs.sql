create table if not exists public.quality_rework_repairs (
  id uuid primary key default gen_random_uuid(),
  document_no text,
  rework_category text not null,
  product_name text not null,
  specification_model text not null,
  responsible_unit text not null,
  quantity integer not null,
  planned_rework_date date,
  actual_rework_date date,
  defect_description text not null default '',
  application_reason text not null default '',
  workshop_applicant text not null default '',
  application_date date,
  production_reviewer text not null default '',
  production_review_date date,
  technical_review_opinion text not null default '',
  technical_reviewer text not null default '',
  technical_review_date date,
  improvement_actions text not null default '',
  improvement_owner text not null default '',
  improvement_date date,
  verification_result text not null default '',
  quality_verifier text not null default '',
  verification_date date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint quality_rework_repairs_document_no_not_blank check (
    document_no is null
    or btrim(document_no) <> ''
  ),
  constraint quality_rework_repairs_category_valid check (
    rework_category in ('进货检验不合格', '过程检验不合格', '成品检验不合格', '顾客退货')
  ),
  constraint quality_rework_repairs_product_name_not_blank check (btrim(product_name) <> ''),
  constraint quality_rework_repairs_specification_model_not_blank check (btrim(specification_model) <> ''),
  constraint quality_rework_repairs_responsible_unit_not_blank check (btrim(responsible_unit) <> ''),
  constraint quality_rework_repairs_quantity_positive check (quantity > 0)
);
comment on table public.quality_rework_repairs is '质量返工返修申报记录';
comment on column public.quality_rework_repairs.document_no is '表单编号';
comment on column public.quality_rework_repairs.rework_category is '返工返修类别';
comment on column public.quality_rework_repairs.product_name is '产品名称';
comment on column public.quality_rework_repairs.specification_model is '规格型号';
comment on column public.quality_rework_repairs.responsible_unit is '责任单位';
comment on column public.quality_rework_repairs.quantity is '返工返修数量';
comment on column public.quality_rework_repairs.planned_rework_date is '计划返工时间';
comment on column public.quality_rework_repairs.actual_rework_date is '实际返工时间';
comment on column public.quality_rework_repairs.defect_description is '不合格描述';
comment on column public.quality_rework_repairs.application_reason is '返工返修申请理由';
comment on column public.quality_rework_repairs.workshop_applicant is '申请人（车间）';
comment on column public.quality_rework_repairs.application_date is '申请日期';
comment on column public.quality_rework_repairs.production_reviewer is '审核人（生产部）';
comment on column public.quality_rework_repairs.production_review_date is '生产部审核日期';
comment on column public.quality_rework_repairs.technical_review_opinion is '技术部审核意见';
comment on column public.quality_rework_repairs.technical_reviewer is '技术部审核人';
comment on column public.quality_rework_repairs.technical_review_date is '技术部审核日期';
comment on column public.quality_rework_repairs.improvement_actions is '改进措施';
comment on column public.quality_rework_repairs.improvement_owner is '改进措施责任人';
comment on column public.quality_rework_repairs.improvement_date is '改进措施日期';
comment on column public.quality_rework_repairs.verification_result is '返工返修验证结果';
comment on column public.quality_rework_repairs.quality_verifier is '验证人（质量部）';
comment on column public.quality_rework_repairs.verification_date is '验证日期';
create unique index if not exists idx_quality_rework_repairs_document_no_unique on public.quality_rework_repairs (document_no)
where document_no is not null;
create index if not exists idx_quality_rework_repairs_updated_at_desc on public.quality_rework_repairs (updated_at desc);
create index if not exists idx_quality_rework_repairs_category on public.quality_rework_repairs (rework_category);
create index if not exists idx_quality_rework_repairs_responsible_unit on public.quality_rework_repairs (responsible_unit);
drop trigger if exists update_quality_rework_repairs_updated_at on public.quality_rework_repairs;
create trigger update_quality_rework_repairs_updated_at before
update on public.quality_rework_repairs for each row execute function public.update_updated_at_column();
insert into public.permissions (key, scope, module, surface, label)
values ('nav:quality', 'nav', 'quality', 'pc', '质量菜单分组'),
  (
    'page:quality-rework-repair',
    'page',
    'quality',
    'pc',
    '质量返工返修'
  ) on conflict (key) do nothing;
alter table public.quality_rework_repairs enable row level security;
drop policy if exists "Quality rework repairs permission rw" on public.quality_rework_repairs;
create policy "Quality rework repairs permission rw" on public.quality_rework_repairs for all to authenticated using (
  public.current_user_has_permission('page:quality-rework-repair')
) with check (
  public.current_user_has_permission('page:quality-rework-repair')
);