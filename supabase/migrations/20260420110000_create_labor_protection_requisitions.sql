create table if not exists public.labor_protection_requisitions (
  id uuid primary key default gen_random_uuid(),
  labor_protection_data_id uuid not null references public.labor_protection_data (id) on update cascade on delete restrict,
  job_title text not null,
  quantity integer not null,
  recipient text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint labor_protection_requisitions_job_title_not_blank check (btrim(job_title) <> ''),
  constraint labor_protection_requisitions_quantity_positive check (quantity > 0),
  constraint labor_protection_requisitions_recipient_not_blank check (btrim(recipient) <> '')
);
comment on table public.labor_protection_requisitions is '劳保领料单';
comment on column public.labor_protection_requisitions.labor_protection_data_id is '关联劳保资料';
comment on column public.labor_protection_requisitions.job_title is '岗位';
comment on column public.labor_protection_requisitions.quantity is '数量';
comment on column public.labor_protection_requisitions.recipient is '领取人';
create index if not exists idx_labor_protection_requisitions_data_id on public.labor_protection_requisitions (labor_protection_data_id);
create index if not exists idx_labor_protection_requisitions_updated_at_desc on public.labor_protection_requisitions (updated_at desc);
drop trigger if exists update_labor_protection_requisitions_updated_at on public.labor_protection_requisitions;
create trigger update_labor_protection_requisitions_updated_at before
update on public.labor_protection_requisitions for each row execute function public.update_updated_at_column();
alter table public.labor_protection_requisitions enable row level security;
drop policy if exists "Labor protection requisitions admin all" on public.labor_protection_requisitions;
create policy "Labor protection requisitions admin all" on public.labor_protection_requisitions for all to authenticated using (public.is_admin()) with check (public.is_admin());