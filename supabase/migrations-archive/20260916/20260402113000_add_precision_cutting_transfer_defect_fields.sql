alter table public.precision_cutting_transfers
add column if not exists raw_material_defect_count integer not null default 0 check (raw_material_defect_count >= 0),
  add column if not exists processing_defect_count integer not null default 0 check (processing_defect_count >= 0),
  add column if not exists defect_reason text;
comment on column public.precision_cutting_transfers.raw_material_defect_count is '原料不良数';
comment on column public.precision_cutting_transfers.processing_defect_count is '加工不良数';
comment on column public.precision_cutting_transfers.defect_reason is '不良原因';