alter table public.packaging_work_orders
add column if not exists weight_per_meter_kg numeric(10, 4) not null default 0
check (weight_per_meter_kg >= 0),
add column if not exists defective_quantity numeric(12, 2) not null default 0
check (defective_quantity >= 0),
add column if not exists defective_weight_kg numeric generated always as (
  defective_quantity * coalesce(length_mm, 0) / 1000.0 * weight_per_meter_kg
) stored;

comment on column public.packaging_work_orders.weight_per_meter_kg is
  '包装生产工单米重（kg/m），默认从销售订单带出，可手动修改';
comment on column public.packaging_work_orders.defective_quantity is
  '包装生产工单不良数量';
comment on column public.packaging_work_orders.defective_weight_kg is
  '包装生产工单不良重量（kg），自动计算 = 不良数量 × 长度(mm) ÷ 1000 × 米重';
