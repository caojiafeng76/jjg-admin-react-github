create table if not exists public.tooling_data (
  id uuid primary key default gen_random_uuid(),
  tool_code text not null,
  tool_name text not null,
  tool_spec text not null,
  material text not null,
  unit_price numeric(12, 2) not null,
  usage text not null,
  remarks text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tooling_data_tool_code_not_blank check (btrim(tool_code) <> ''),
  constraint tooling_data_tool_name_not_blank check (btrim(tool_name) <> ''),
  constraint tooling_data_tool_spec_not_blank check (btrim(tool_spec) <> ''),
  constraint tooling_data_material_not_blank check (btrim(material) <> ''),
  constraint tooling_data_usage_not_blank check (btrim(usage) <> ''),
  constraint tooling_data_remarks_not_blank check (btrim(remarks) <> ''),
  constraint tooling_data_unit_price_non_negative check (unit_price >= 0::numeric)
);
comment on table public.tooling_data is '刀具资料';
comment on column public.tooling_data.tool_code is '刀具编号';
comment on column public.tooling_data.tool_name is '刀具名称';
comment on column public.tooling_data.tool_spec is '刀具规格';
comment on column public.tooling_data.material is '材质';
comment on column public.tooling_data.unit_price is '单价，单位：元';
comment on column public.tooling_data.usage is '用途';
comment on column public.tooling_data.remarks is '备注';
create unique index if not exists idx_tooling_data_tool_code_unique on public.tooling_data (tool_code);
create index if not exists idx_tooling_data_updated_at_desc on public.tooling_data (updated_at desc);
drop trigger if exists update_tooling_data_updated_at on public.tooling_data;
create trigger update_tooling_data_updated_at before
update on public.tooling_data for each row execute function public.update_updated_at_column();
alter table public.tooling_data enable row level security;
drop policy if exists "Tooling data admin all" on public.tooling_data;
create policy "Tooling data admin all" on public.tooling_data for all to authenticated using (public.is_admin()) with check (public.is_admin());