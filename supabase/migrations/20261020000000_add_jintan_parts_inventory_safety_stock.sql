-- ============================================================
-- 金檀木业配件库存：安全库存 / 阈值三色状态
--   unit_quantity    单台数量（null = 未设置，不参与着色）
--   safety_multiple  倍数（默认 10，至少 5，保证 安全库存 >= 阈值）
--   safety_stock     安全库存 = 单台数量 × 倍数（生成列）
--   threshold_stock  库存阈值 = 单台数量 × 5（生成列）
--   stock_status     unset / safe(库存 >= 安全库存) / danger(库存 < 阈值) / warning(介于两者之间)
--   stock_status_rank danger 0 / warning 1 / safe 2 / unset 3，列表"不足排前面"使用
-- 出入库 RPC 只更新 quantity，生成列自动重算
-- ============================================================

alter table public.jintan_parts_inventory
  add column if not exists unit_quantity integer
    constraint jintan_parts_inventory_unit_quantity_positive
    check (unit_quantity is null or unit_quantity > 0),
  add column if not exists safety_multiple integer not null default 10
    constraint jintan_parts_inventory_safety_multiple_min
    check (safety_multiple >= 5);

alter table public.jintan_parts_inventory
  add column if not exists safety_stock integer
  generated always as (unit_quantity * safety_multiple) stored;

alter table public.jintan_parts_inventory
  add column if not exists threshold_stock integer
  generated always as (unit_quantity * 5) stored;

alter table public.jintan_parts_inventory
  add column if not exists stock_status text
  generated always as (
    case
      when unit_quantity is null then 'unset'
      when quantity >= unit_quantity * safety_multiple then 'safe'
      when quantity < unit_quantity * 5 then 'danger'
      else 'warning'
    end
  ) stored;

alter table public.jintan_parts_inventory
  add column if not exists stock_status_rank smallint
  generated always as (
    case
      when unit_quantity is null then 3
      when quantity >= unit_quantity * safety_multiple then 2
      when quantity < unit_quantity * 5 then 0
      else 1
    end
  ) stored;

comment on column public.jintan_parts_inventory.unit_quantity is '单台数量（为空表示未设置安全库存）';
comment on column public.jintan_parts_inventory.safety_multiple is '安全库存倍数（至少 5）';
comment on column public.jintan_parts_inventory.safety_stock is '安全库存 = 单台数量 × 倍数';
comment on column public.jintan_parts_inventory.threshold_stock is '库存阈值 = 单台数量 × 5';
comment on column public.jintan_parts_inventory.stock_status is '库存状态：unset 未设置 / safe 充足 / warning 偏低 / danger 不足';
comment on column public.jintan_parts_inventory.stock_status_rank is '库存状态排序：danger 0 / warning 1 / safe 2 / unset 3';

create index if not exists idx_jintan_parts_inventory_status_rank_updated_at
on public.jintan_parts_inventory (stock_status_rank, updated_at desc);
