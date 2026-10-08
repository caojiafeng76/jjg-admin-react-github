-- ============================================================
-- 金檀木业配件出库流水补录（来源：《金檀木业配件资料_37条_2026-10-06_10-56-32 - 副本.xlsx》出库列）
-- 口径（已由用户确认）：仅 20 行有出库数的行记流水（合计 425），28 行空白=无出库不建记录；
--   库存最终不动（之前已按最新盘点更新）。出库表禁止 0/负数，故空白行只能跳过。
-- 机制：出库 BEFORE INSERT 触发器必然扣减库存，本迁移同事务内等额补回，
--   并以首尾快照断言库存零变化；触发器全程保持启用。重跑安全：20 行已存在则跳过，部分存在则报错。
-- 20 行（公式已求值）总量 425，详见 VALUES。
-- ============================================================

create temporary table _jintan_parts_out_excel (
  part_name     text not null,
  specification text not null default '',
  quantity      integer not null,
  constraint _jintan_parts_out_excel_key_unique unique (part_name, specification),
  constraint _jintan_parts_out_excel_qty_positive check (quantity > 0)
) on commit drop;

insert into pg_temp._jintan_parts_out_excel (part_name, specification, quantity)
values
  ('140U转轴固定座', '', 1),
  ('220U转轴固定轴套', '', 29),
  ('4mm内六角扳手', '', 2),
  ('5mm内六角扳手', '', 1),
  ('内六角圆头螺丝', 'M8*25', 18),
  ('内六角沉头螺丝', 'M6*16', 46),
  ('内六角沉头螺丝', 'M6*25', 28),
  ('内六角沉头螺丝', 'M8*25', 4),
  ('十字圆头自攻螺钉', 'ST4.2*20', 168),
  ('垫片', 'φ10*20*2', 22),
  ('垫片', 'φ8*16*2', 6),
  ('手摇机', '', 1),
  ('手摇机连接杆套件', '', 1),
  ('膨胀螺栓', 'M10*100', 32),
  ('衬套', 'φ8*10*16', 20),
  ('衬套', 'φ6*8*16', 3),
  ('防松螺母', 'M6', 3),
  ('防松螺母', 'M8', 34),
  ('内六角圆头螺丝', 'M6*25', 5),
  ('防松螺母', 'M10', 1);

-- 迁移前库存快照（终态逐行比对，保证“库存不动”）
create temporary table _jintan_parts_inv_before as
select id, quantity from public.jintan_parts_inventory;

do $$
declare
  v_count integer;
  v_missing text;
  v_over text;
  v_existing integer;
  v_out_n integer;
  v_out_total integer;
  v_diff text;
begin
  -- 前置断言 1：行数
  select count(*) into v_count from pg_temp._jintan_parts_out_excel;
  if v_count <> 20 then
    raise exception '表格行数异常，期望 20，实际 %', v_count;
  end if;

  -- 前置断言 2：20 行全部匹配到库存行
  select string_agg(format('%s / %s', d.part_name, d.specification), '；')
    into v_missing
  from pg_temp._jintan_parts_out_excel d
  where not exists (
    select 1
    from public.jintan_parts_data pd
    join public.jintan_parts_inventory inv on inv.part_data_id = pd.id
    where pd.part_name = d.part_name
      and pd.specification = d.specification
  );
  if v_missing is not null then
    raise exception '以下配件未匹配到库存行，取消记出库：%', v_missing;
  end if;

  -- 前置断言 3：出库数不得超过当前库存
  select string_agg(format('%s / %s', d.part_name, d.specification), '；')
    into v_over
  from pg_temp._jintan_parts_out_excel d
  join public.jintan_parts_data pd
    on pd.part_name = d.part_name
   and pd.specification = d.specification
  join public.jintan_parts_inventory inv on inv.part_data_id = pd.id
  where inv.quantity < d.quantity;
  if v_over is not null then
    raise exception '以下配件库存不足，取消记出库：%', v_over;
  end if;

  -- 幂等：20 行已全部记过则跳过；部分存在则报错人工核查
  select count(*) into v_existing
  from pg_temp._jintan_parts_out_excel d
  join public.jintan_parts_data pd
    on pd.part_name = d.part_name
   and pd.specification = d.specification
  join public.jintan_parts_inventory inv on inv.part_data_id = pd.id
  where exists (
    select 1 from public.jintan_parts_stock_out so
    where so.inventory_id = inv.id and so.quantity = d.quantity
  );
  if v_existing = 20 then
    raise notice '20 行出库已存在，跳过本次补录';
    return;
  end if;
  if v_existing > 0 then
    raise exception '已有 % 行出库记录，部分执行过，请人工核查后再跑', v_existing;
  end if;

  -- 记出库流水（触发器同事务扣减库存，快照由触发器从库存行填写）
  insert into public.jintan_parts_stock_out (inventory_id, quantity, remarks)
  select inv.id, d.quantity, ''
  from pg_temp._jintan_parts_out_excel d
  join public.jintan_parts_data pd
    on pd.part_name = d.part_name
   and pd.specification = d.specification
  join public.jintan_parts_inventory inv on inv.part_data_id = pd.id;

  -- 等额补回库存（最终零变化；updated_at 会被触发器刷新，数量不变）
  update public.jintan_parts_inventory as inv
  set quantity = inv.quantity + d.quantity
  from pg_temp._jintan_parts_out_excel as d
  join public.jintan_parts_data as pd
    on pd.part_name = d.part_name
   and pd.specification = d.specification
  where inv.part_data_id = pd.id;

  -- 终态断言 1：出库 20 行合计 425
  select count(*), coalesce(sum(d.quantity), 0) into v_out_n, v_out_total
  from pg_temp._jintan_parts_out_excel d
  join public.jintan_parts_data pd
    on pd.part_name = d.part_name
   and pd.specification = d.specification
  join public.jintan_parts_inventory inv on inv.part_data_id = pd.id
  where exists (
    select 1 from public.jintan_parts_stock_out so
    where so.inventory_id = inv.id and so.quantity = d.quantity
  );
  if v_out_n <> 20 or v_out_total <> 425 then
    raise exception '出库复核不符：% 行 / 合计 %（期望 20 行 / 425）', v_out_n, v_out_total;
  end if;

  -- 终态断言 2：全库库存数量与迁移前快照逐行一致
  select string_agg(left(inv.id::text, 8), '、') into v_diff
  from public.jintan_parts_inventory inv
  join pg_temp._jintan_parts_inv_before b on b.id = inv.id
  where inv.quantity is distinct from b.quantity;
  if v_diff is not null then
    raise exception '库存发生变化，取消提交，差异行：%', v_diff;
  end if;
end $$;
