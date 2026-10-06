create table if not exists public.jintan_materials_data (
  id             uuid primary key default gen_random_uuid(),
  material_model text not null default '',
  material_name  text not null,
  specification  text not null default '',
  material       text not null default '',
  remarks        text not null default '',
  created_at     timestamp with time zone not null default now(),
  updated_at     timestamp with time zone not null default now(),
  constraint jintan_materials_data_material_name_not_blank check (btrim(material_name) <> ''),
  constraint jintan_materials_data_model_name_spec_unique unique (material_model, material_name, specification)
);

comment on table public.jintan_materials_data is '金檀木业素材资料';
comment on column public.jintan_materials_data.material_model is '型号';
comment on column public.jintan_materials_data.material_name is '名称';
comment on column public.jintan_materials_data.specification is '规格';
comment on column public.jintan_materials_data.material is '材质';
comment on column public.jintan_materials_data.remarks is '备注';

create index if not exists idx_jintan_materials_data_updated_at_desc
on public.jintan_materials_data (updated_at desc);

drop trigger if exists update_jintan_materials_data_updated_at on public.jintan_materials_data;
create trigger update_jintan_materials_data_updated_at
before update on public.jintan_materials_data
for each row execute function public.update_updated_at_column();

drop trigger if exists prevent_viewer_dml_trigger on public.jintan_materials_data;
create trigger prevent_viewer_dml_trigger
before insert or update or delete on public.jintan_materials_data
for each row execute function public.prevent_viewer_dml();

alter table public.jintan_materials_data enable row level security;

drop policy if exists "Jintan materials data admin all" on public.jintan_materials_data;
create policy "Jintan materials data admin all"
on public.jintan_materials_data
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Jintan materials data permission rw" on public.jintan_materials_data;
create policy "Jintan materials data permission rw"
on public.jintan_materials_data
for all
to authenticated
using (public.current_user_has_permission('page:jintan-materials-data'))
with check (public.current_user_has_permission('page:jintan-materials-data'));
