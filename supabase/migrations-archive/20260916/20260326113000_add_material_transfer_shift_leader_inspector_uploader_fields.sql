alter table public.material_transfers
add column if not exists shift_leader_name text,
  add column if not exists inspector_name text,
  add column if not exists uploaded_by_name text;
comment on column public.material_transfers.shift_leader_name is '当班负责人';
comment on column public.material_transfers.inspector_name is '检验人';
comment on column public.material_transfers.uploaded_by_name is '数据上传人';