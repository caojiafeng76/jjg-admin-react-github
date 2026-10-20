-- ============================================================
-- 金檀木业配件安全库存补录（来源：《凉亭螺丝安全库存.xlsx》220U凉亭 + 140U凉亭 两个工作表）
-- 口径（已由用户确认）：
--   只取"倍数"列有值的行；表格"倍数"列 = 单台数量 × 10（已算好的安全库存），系统存 单台数量 + 倍数
--   同一配件多行 / 跨两个型号：单台数量全部相加
--   扳手按表格合计反推倍数：4mm 单台 2 × 15 = 30（220U 20 + 140U 10），5mm 单台 1 × 20 = 20
--   名称/规格写法不一致的按同一配件合并（如 内六角沉头螺钉 → 内六角沉头螺丝、衬套 φ8*16*10 → φ8*10*16、
--     转轴轴套 → 220U转轴固定轴套、润滑油 → 润滑脂、蘑菇头橡胶条 → 140U橡胶密封条 等）
--   8 个新配件自动补配件资料（库存 0）；型材件（铝合金固定座、固定座封头板）、叶片固定盖板、叶片弹簧盖板跳过
-- 幂等：只更新 unit_quantity / safety_multiple，不改库存数量；重复执行结果一致
-- 顺序：暂存 -> 补配件资料（触发器自动建 0 库存行）-> 兜底补 0 库存行 -> 断言全匹配 -> 更新 -> 复核
-- ============================================================

create temporary table _jintan_parts_safety_import (
  part_name       text not null,
  specification   text not null default '',
  material        text not null default '',
  unit_quantity   integer not null,
  safety_multiple integer not null,
  constraint _jintan_parts_safety_import_key_unique unique (part_name, specification),
  constraint _jintan_parts_safety_import_unit_positive check (unit_quantity > 0),
  constraint _jintan_parts_safety_import_multiple_min check (safety_multiple >= 5)
) on commit drop;

insert into pg_temp._jintan_parts_safety_import (part_name, specification, material, unit_quantity, safety_multiple)
values
  -- 已有配件（32）
  ('固定转轴', 'φ14*87', 'SUS304', 14, 10),
  ('十字沉头自攻螺钉', 'ST4.2*20', 'SUS304', 220, 10),
  ('活动转轴', 'φ14*68', 'SUS304', 14, 10),
  ('压簧', '1.6*16*82*14', 'SUS304', 14, 10),
  ('十字圆头自攻螺钉', 'ST4.2*20', 'SUS304', 386, 10),
  ('拉铆钉', '6mm', 'SUS304', 14, 10),
  ('膨胀螺栓', 'M10*100', 'SUS304', 32, 10),
  ('垫片', 'φ10*20*2', '尼龙', 14, 10),
  ('垫片', 'φ8*16*2', '尼龙', 1, 10),
  ('防松螺母', 'M8', 'SUS304', 20, 10),
  ('防松螺母', 'M6', 'SUS304', 1, 10),
  ('防松螺母', 'M10', 'SUS304', 1, 10),
  ('4mm内六角扳手', '', '', 2, 15),
  ('5mm内六角扳手', '', '', 1, 20),
  ('电机传动轴', '', 'SUS304', 1, 10),
  ('R型销', '1.6*28', 'SUS304', 22, 10),
  ('内六角沉头螺丝', 'M6*16', 'SUS304', 40, 10),
  ('内六角沉头螺丝', 'M6*25', 'SUS304', 40, 10),
  ('内六角沉头螺丝', 'M8*25', 'SUS304', 6, 10),
  ('内六角圆头螺丝', 'M8*25', 'SUS304', 14, 10),
  ('内六角圆头螺丝', 'M6*25', 'SUS304', 1, 10),
  ('拉铆螺母', 'M6', 'SUS304', 4, 10),
  ('衬套', 'φ8*10*16', 'SUS304', 14, 10),
  ('衬套', 'φ6*8*16', 'SUS304', 1, 10),
  ('转轴销', 'φ14*31', '6063', 44, 10),
  ('连杆销', 'φ11*25.5', '6063', 22, 10),
  ('220U转轴固定轴套', '', 'PA6', 28, 10),
  ('140U转轴固定座', '', 'PA6', 44, 10),
  ('140U横梁转角套', '', 'PA6', 8, 10),
  ('140U底脚盖', '', '3003', 4, 10),
  ('润滑脂', '', '', 2, 10),
  ('140U橡胶密封条', '', 'EPDM', 22, 10),
  -- 新配件（8）
  ('玻璃胶', '', '', 2, 10),
  ('外六角螺钉', 'M10*55', 'SUS304', 1, 10),
  ('毛刷', '2883', '', 2, 10),
  ('手摇杆', '2.2m', '', 1, 10),
  ('转角盖板', '50*50*2.5', '6063', 8, 10),
  ('横梁盖板', '', '', 4, 10),
  ('转角组件', '', '', 4, 10),
  ('叶片固定盖板组件', '', '', 14, 10);

-- A. 补缺失的配件资料（已存在则跳过；INSERT 触发器自动建 0 库存行）
insert into public.jintan_parts_data (part_name, specification, material)
select part_name, specification, material
from pg_temp._jintan_parts_safety_import
on conflict (part_name, specification) do nothing;

-- B. 兜底补 0 库存行（幂等，不覆盖已有数量）
insert into public.jintan_parts_inventory (
  part_data_id,
  part_name,
  specification,
  material,
  supplier
)
select id, part_name, specification, material, supplier
from public.jintan_parts_data
on conflict (part_data_id) do nothing;

-- C. 前置断言：40 行必须全部匹配到库存行，否则整体回滚
do $$
declare
  v_missing text;
  v_count integer;
begin
  select count(*) into v_count from pg_temp._jintan_parts_safety_import;
  if v_count <> 40 then
    raise exception '安全库存行数异常，期望 40，实际 %', v_count;
  end if;

  select string_agg(format('“%s”/“%s”', d.part_name, d.specification), '、')
    into v_missing
  from pg_temp._jintan_parts_safety_import d
  where not exists (
    select 1
    from public.jintan_parts_data pd
    join public.jintan_parts_inventory inv on inv.part_data_id = pd.id
    where pd.part_name = d.part_name
      and pd.specification = d.specification
  );
  if v_missing is not null then
    raise exception '以下配件未匹配到库存行，取消更新：%', v_missing;
  end if;
end $$;

-- D. 写入单台数量 / 倍数（库存数量与快照不动）
update public.jintan_parts_inventory as inv
set unit_quantity = d.unit_quantity,
    safety_multiple = d.safety_multiple
from pg_temp._jintan_parts_safety_import as d
join public.jintan_parts_data as pd
  on pd.part_name = d.part_name
 and pd.specification = d.specification
where inv.part_data_id = pd.id
  and (inv.unit_quantity, inv.safety_multiple)
    is distinct from (d.unit_quantity, d.safety_multiple);

-- E. 事后复核：40 行必须与表格一致，否则整体回滚
do $$
declare
  v_mismatch text;
begin
  select string_agg(format('“%s”/“%s”', d.part_name, d.specification), '、')
    into v_mismatch
  from pg_temp._jintan_parts_safety_import d
  join public.jintan_parts_data pd
    on pd.part_name = d.part_name
   and pd.specification = d.specification
  join public.jintan_parts_inventory inv on inv.part_data_id = pd.id
  where inv.unit_quantity is distinct from d.unit_quantity
     or inv.safety_multiple is distinct from d.safety_multiple
     or inv.safety_stock is distinct from d.unit_quantity * d.safety_multiple;
  if v_mismatch is not null then
    raise exception '以下配件安全库存与表格不一致，取消提交：%', v_mismatch;
  end if;
end $$;
