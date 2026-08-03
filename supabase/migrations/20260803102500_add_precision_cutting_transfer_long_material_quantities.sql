alter table public.precision_cutting_transfers
  add column if not exists process_card_long_material_quantity integer
    check (process_card_long_material_quantity > 0),
  add column if not exists erp_long_material_quantity integer
    check (erp_long_material_quantity > 0);

comment on column public.precision_cutting_transfers.long_material_quantity is '实际长料数量';
comment on column public.precision_cutting_transfers.process_card_long_material_quantity is '流程卡长料数量';
comment on column public.precision_cutting_transfers.erp_long_material_quantity is 'ERP长料数量';
