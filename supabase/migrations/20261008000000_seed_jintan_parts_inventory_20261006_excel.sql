-- ============================================================
-- 金檀木业配件库存数据补录（来源：《金檀木业配件资料_37条_2026-10-06_10-56-32.xlsx》，实际 48 行）
-- 口径（已由用户确认）：空库存数量按 0 入库；11 个新品自动补配件资料；全量覆盖数量/备注
-- 幂等：重复执行不会产生重复行（自然键 part_name + specification 唯一），数量按表格覆盖
-- 顺序：暂存表格 -> 补配件资料（触发器自动建 0 库存行）-> 兜底补 0 库存行 -> 断言全匹配 -> 更新数量/备注 -> 复核
-- 表格合计：48 行，库存总量 17197（其中 5 行空数量按 0 计：手摇杆 1.5m、毛巾、纸箱、线手套、转轴销 φ14*31）
-- 11 个新品（seed 之外）：
--     内六角圆头螺丝 / M6*20
--     内六角圆头螺丝 / M6*25
--     内六角圆头螺丝 / M8*35
--     十字平头螺钉 / M6*16
--     水槽折弯件 / (空规格)
--     内六角圆头螺丝 / M5*18
--     防松螺母 / M10
--     衬套 / φ8*10*22
--     轴套 / φ8*10*8
--     水槽焊接铝片 / (空规格)
--     轴套 / (空规格)
-- ============================================================

create temporary table _jintan_parts_excel_import (
  part_name     text not null,
  specification text not null default '',
  material      text not null default '',
  supplier      text not null default '',
  quantity      integer not null default 0,
  remarks       text not null default '',
  constraint _jintan_parts_excel_import_key_unique unique (part_name, specification),
  constraint _jintan_parts_excel_import_qty_non_negative check (quantity >= 0)
) on commit drop;

insert into pg_temp._jintan_parts_excel_import (part_name, specification, material, supplier, quantity, remarks)
values
  ('140U底脚盖', '', '3003', '', 14, ''),
  ('140U横梁转角套', '', 'PA6', '烨煜塑料厂', 207, ''),
  ('140U橡胶密封条', '', 'EPDM', '海达', 1, '卷'),
  ('140U转轴固定座', '', 'PA6', '烨煜塑料厂', 513, ''),
  ('220U橡胶密封条', '', 'EPDM', '海达', 1, '卷'),
  ('220U转轴固定轴套', '', 'PA6', '烨煜塑料厂', 508, ''),
  ('4mm内六角扳手', '', '', '', 14, ''),
  ('5mm内六角扳手', '', '', '', 16, ''),
  ('R型销', '1.6*28', 'SUS304', '南浔螺丝店', 300, ''),
  ('内六角圆头螺丝', 'M8*25', 'SUS304', '南浔螺丝店', 232, ''),
  ('内六角沉头螺丝', 'M6*16', 'SUS304', '南浔螺丝店', 1005, ''),
  ('内六角沉头螺丝', 'M6*25', 'SUS304', '南浔螺丝店', 542, ''),
  ('内六角沉头螺丝', 'M8*25', 'SUS304', '南浔螺丝店', 385, ''),
  ('十字圆头自攻螺钉', 'ST4.2*20', 'SUS304', '南浔螺丝店', 944, ''),
  ('十字沉头自攻螺钉', 'ST4.2*20', 'SUS304', '南浔螺丝店', 2041, ''),
  ('压簧', '1.6*16*82*14', 'SUS304', '蓝工', 20, ''),
  ('固定转轴', 'φ14*87', 'SUS304', '自制', 261, ''),
  ('垫片', 'φ10*20*2', '尼龙', '南浔螺丝店', 1039, ''),
  ('垫片', 'φ8*16*2', '尼龙', '南浔螺丝店', 1088, ''),
  ('手摇机', '', '', '', 42, ''),
  ('手摇机连接杆套件', '', 'SUS304', '林总', 8, ''),
  ('手摇杆', '1.5m', '', '', 0, ''),
  ('拉铆螺母', 'M6', 'SUS304', '南浔螺丝店', 100, ''),
  ('拉铆钉', '6mm', 'SUS304', '南浔螺丝店', 45, ''),
  ('毛巾', '', '', '', 0, ''),
  ('活动转轴', 'φ14*68', 'SUS304', '自制', 90, ''),
  ('润滑脂', '', '', '', 1, '桶'),
  ('电机传动轴', '', 'SUS304', '自制', 1, ''),
  ('纸箱', '', '', '海盐金佑', 0, ''),
  ('线手套', '', '', '', 0, ''),
  ('膨胀螺栓', 'M10*100', 'SUS304', '南浔螺丝店', 175, ''),
  ('衬套', 'φ8*10*16', 'SUS304', '南浔螺丝店', 143, ''),
  ('衬套', 'φ6*8*16', 'SUS304', '南浔螺丝店', 91, ''),
  ('转轴销', 'φ14*31', '6063', '吴江菀坪', 0, ''),
  ('连杆销', 'φ11*25.5', '6063', '吴江菀坪', 590, ''),
  ('防松螺母', 'M6', 'SUS304', '南浔螺丝店', 1783, ''),
  ('防松螺母', 'M8', 'SUS304', '南浔螺丝店', 813, ''),
  ('内六角圆头螺丝', 'M6*20', 'SUS304', '南浔螺丝店', 598, ''),
  ('内六角圆头螺丝', 'M6*25', 'SUS304', '南浔螺丝店', 570, ''),
  ('内六角圆头螺丝', 'M8*35', 'SUS304', '南浔螺丝店', 238, ''),
  ('十字平头螺钉', 'M6*16', 'SUS304', '南浔螺丝店', 805, ''),
  ('水槽折弯件', '', '', '', 372, ''),
  ('内六角圆头螺丝', 'M5*18', 'SUS304', '南浔螺丝店', 100, ''),
  ('防松螺母', 'M10', 'SUS304', '南浔螺丝店', 337, ''),
  ('衬套', 'φ8*10*22', 'SUS304', '南浔螺丝店', 194, ''),
  ('轴套', 'φ8*10*8', 'SUS304', '南浔螺丝店', 198, ''),
  ('水槽焊接铝片', '', '', '', 600, ''),
  ('轴套', '', '', '', 172, '');

-- A. 补缺失的配件资料（已存在则跳过；INSERT 触发器自动建 0 库存行）
insert into public.jintan_parts_data (part_name, specification, material, supplier)
select distinct part_name, specification, material, supplier
from pg_temp._jintan_parts_excel_import
on conflict (part_name, specification) do nothing;

-- B. 为既有配件资料兜底补 0 库存行（幂等，不覆盖已有数量）
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

-- C. 前置断言：48 行必须全部匹配到库存行，否则整体回滚
do $$
declare
  v_missing text;
  v_count integer;
begin
  select count(*) into v_count from pg_temp._jintan_parts_excel_import;
  if v_count <> 48 then
    raise exception '表格行数异常，期望 48，实际 %', v_count;
  end if;

  select string_agg(format('“%s”/“%s”', d.part_name, d.specification), '、')
    into v_missing
  from pg_temp._jintan_parts_excel_import d
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

-- D. 按表格全量更新库存数量/备注（名称/规格/材质/厂家快照以配件资料为准，不覆盖）
update public.jintan_parts_inventory as inv
set quantity = d.quantity,
    remarks = d.remarks
from pg_temp._jintan_parts_excel_import as d
join public.jintan_parts_data as pd
  on pd.part_name = d.part_name
 and pd.specification = d.specification
where inv.part_data_id = pd.id;

-- E. 事后复核：48 行数量/备注必须与表格一致，否则整体回滚
do $$
declare
  v_mismatch text;
begin
  select string_agg(format('“%s”/“%s”', d.part_name, d.specification), '、')
    into v_mismatch
  from pg_temp._jintan_parts_excel_import d
  join public.jintan_parts_data pd
    on pd.part_name = d.part_name
   and pd.specification = d.specification
  join public.jintan_parts_inventory inv on inv.part_data_id = pd.id
  where inv.quantity is distinct from d.quantity
     or inv.remarks is distinct from d.remarks;
  if v_mismatch is not null then
    raise exception '以下配件库存与表格不一致，取消提交：%', v_mismatch;
  end if;
end $$;
