create table if not exists public.youmai_product_data (
  id uuid primary key default gen_random_uuid(),
  material_code text not null,
  material_name text not null,
  model text not null,
  specification text not null,
  specific_gravity numeric(12, 6) not null,
  remarks text not null default '',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint youmai_product_data_material_code_not_blank check (btrim(material_code) <> ''),
  constraint youmai_product_data_material_name_not_blank check (btrim(material_name) <> ''),
  constraint youmai_product_data_model_not_blank check (btrim(model) <> ''),
  constraint youmai_product_data_specification_not_blank check (btrim(specification) <> ''),
  constraint youmai_product_data_specific_gravity_non_negative check (specific_gravity >= 0::numeric)
);
comment on table public.youmai_product_data is '优迈货品资料';
comment on column public.youmai_product_data.material_code is '物料编码';
comment on column public.youmai_product_data.material_name is '物料名称';
comment on column public.youmai_product_data.model is '型号';
comment on column public.youmai_product_data.specification is '规格';
comment on column public.youmai_product_data.specific_gravity is '比重';
comment on column public.youmai_product_data.remarks is '备注';
create unique index if not exists idx_youmai_product_data_material_code_unique on public.youmai_product_data (material_code);
create index if not exists idx_youmai_product_data_updated_at_desc on public.youmai_product_data (updated_at desc);
drop trigger if exists update_youmai_product_data_updated_at on public.youmai_product_data;
create trigger update_youmai_product_data_updated_at before
update on public.youmai_product_data for each row execute function public.update_updated_at_column();
alter table public.youmai_product_data enable row level security;
drop policy if exists "Youmai product data admin all" on public.youmai_product_data;
create policy "Youmai product data admin all" on public.youmai_product_data for all to authenticated using (public.is_admin()) with check (public.is_admin());