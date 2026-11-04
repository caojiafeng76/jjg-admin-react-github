-- ============================================================
-- 修正素材 YDG222-162 / 百叶片 / 3300 的库存与流水差额
--   2026-11-04 库存被直接改小 9（流水结余 25，实际 16），月度报表倒推出上月结余 -9
--   实物确认为 16：先恢复到流水结余 25，再补录 9 的出库单（出库触发器扣回 16）
--   库存已不是 16 时中止，避免覆盖之后的改动
-- ============================================================

do $$
begin
  update public.jintan_materials_inventory
  set quantity = 25
  where id = '9d0e9bb6-90e2-4211-9dc0-91225a324bc6'
    and quantity = 16;

  if not found then
    raise exception '素材 YDG222-162 / 3300 当前库存不是 16，已中止修正';
  end if;

  insert into public.jintan_materials_stock_out (inventory_id, quantity, remarks)
  values (
    '9d0e9bb6-90e2-4211-9dc0-91225a324bc6',
    9,
    '补录：2026-11-04 库存直接改数少 9'
  );
end;
$$;
