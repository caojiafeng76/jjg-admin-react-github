-- 重命名 operator_name 和 inspector_name 列为 legacy_ 前缀，保留历史数据
-- 挤压生产单表单不再使用这两个字段（改为固定班组长下拉）

alter table public.extrusion_productions
  rename column operator_name to legacy_operator_name;

alter table public.extrusion_productions
  rename column inspector_name to legacy_inspector_name;

comment on column public.extrusion_productions.legacy_operator_name is '操作人(已废弃，请使用 legacy_ 前缀)';
comment on column public.extrusion_productions.legacy_inspector_name is '检验人(已废弃，请使用 legacy_ 前缀)';
