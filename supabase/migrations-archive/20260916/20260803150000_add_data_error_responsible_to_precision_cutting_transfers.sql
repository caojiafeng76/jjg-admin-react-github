alter table public.precision_cutting_transfers
  add column if not exists data_error_responsible text;

comment on column public.precision_cutting_transfers.data_error_responsible is '数据错误责任人';
