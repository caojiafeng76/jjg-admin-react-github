-- The operator field is no longer collected by the extrusion production form.
-- Keep historical values while allowing the upsert RPC to omit this legacy field.
alter table public.extrusion_productions
  alter column legacy_operator_name drop not null;
