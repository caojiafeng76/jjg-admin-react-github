-- 创建物料转移单表
create table if not exists public.material_transfers (
  id uuid primary key default gen_random_uuid(),
  project_no text not null,
  product_model text,
  length_mm numeric,
  customer_model text,
  transfer_quantity integer not null check (transfer_quantity > 0),
  operator_employee_id uuid not null references public.employees (id) on update cascade on delete restrict,
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
  remark text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
comment on table public.material_transfers is '物料转移单';
comment on column public.material_transfers.project_no is '项目号';
comment on column public.material_transfers.product_model is '型号快照';
comment on column public.material_transfers.length_mm is '长度快照';
comment on column public.material_transfers.customer_model is '客户型号快照';
comment on column public.material_transfers.transfer_quantity is '转移数量';
comment on column public.material_transfers.operator_employee_id is '操作人员工ID';
comment on column public.material_transfers.target_workshop is '接收车间';
comment on column public.material_transfers.recipient_name is '接收人';
comment on column public.material_transfers.remark is '备注';
create index if not exists idx_material_transfers_project_no on public.material_transfers (project_no);
create index if not exists idx_material_transfers_operator_employee_id on public.material_transfers (operator_employee_id);
create index if not exists idx_material_transfers_target_workshop on public.material_transfers (target_workshop);
create index if not exists idx_material_transfers_created_at_desc on public.material_transfers (created_at desc);
alter table public.material_transfers enable row level security;
drop policy if exists "Material transfers admin all" on public.material_transfers;
create policy "Material transfers admin all" on public.material_transfers for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop trigger if exists update_material_transfers_updated_at on public.material_transfers;
create trigger update_material_transfers_updated_at before
update on public.material_transfers for each row execute function public.update_updated_at_column();