alter table public.packaging_work_orders
add column if not exists defect_reason text;

comment on column public.packaging_work_orders.defect_reason is
  '包装生产工单不良原因，可多行填写';
