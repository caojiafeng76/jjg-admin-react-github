alter table public.precision_cutting_transfers
add column if not exists outsource_defect_quantity integer not null default 0,
  add column if not exists outsource_defect_reason text,
  add column if not exists outsource_unit text,
  add column if not exists responsible_process text,
  add column if not exists process_owner text;
comment on column public.precision_cutting_transfers.outsource_defect_quantity is '外协不良数';
comment on column public.precision_cutting_transfers.outsource_defect_reason is '外协不良原因';
comment on column public.precision_cutting_transfers.outsource_unit is '外协单位';
comment on column public.precision_cutting_transfers.responsible_process is '责任工序';
comment on column public.precision_cutting_transfers.process_owner is '工序负责人';
alter table public.precision_finishing_cuttings
add column if not exists outsource_defect_quantity integer not null default 0,
  add column if not exists outsource_defect_reason text,
  add column if not exists outsource_unit text,
  add column if not exists responsible_process text,
  add column if not exists process_owner text;
comment on column public.precision_finishing_cuttings.outsource_defect_quantity is '外协不良数';
comment on column public.precision_finishing_cuttings.outsource_defect_reason is '外协不良原因';
comment on column public.precision_finishing_cuttings.outsource_unit is '外协单位';
comment on column public.precision_finishing_cuttings.responsible_process is '责任工序';
comment on column public.precision_finishing_cuttings.process_owner is '工序负责人';