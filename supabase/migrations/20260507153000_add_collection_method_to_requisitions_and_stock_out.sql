-- 劳保领料单和刀具出库单：添加领用方式字段（新领取 / 以旧换新）
alter table public.labor_protection_requisitions
  add column if not exists collection_method text not null default '新领取';

comment on column public.labor_protection_requisitions.collection_method is '领用方式：新领取 / 以旧换新';

alter table public.labor_protection_requisitions
  add constraint labor_protection_requisitions_collection_method_valid
  check (collection_method in ('新领取', '以旧换新'));

alter table public.tooling_stock_out
  add column if not exists collection_method text not null default '新领取';

comment on column public.tooling_stock_out.collection_method is '领用方式：新领取 / 以旧换新';

alter table public.tooling_stock_out
  add constraint tooling_stock_out_collection_method_valid
  check (collection_method in ('新领取', '以旧换新'));
