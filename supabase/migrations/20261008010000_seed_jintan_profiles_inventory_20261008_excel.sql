-- ============================================================
-- 金檀木业型材库存数据更新（来源：《金檀木业型材库存_49条_2026-10-08_10-01-36.xlsx》，实际 57 行）
-- 注：文件名“49条”为旧数，表格实际 57 个不同自然键（编号 1–49 有复用，但型号+名称+规格无重复）
-- 口径（已由用户确认）：57 行全量覆盖数量/备注；4 格公式按求值入库；8 个新品自动补型材资料
-- 幂等：重复执行不会产生重复行（自然键 profile_model + profile_name + specification 唯一），数量按表格覆盖
-- 顺序：暂存表格 -> 补型材资料（触发器自动建 0 库存行）-> 兜底补 0 库存行 -> 断言全匹配 -> 更新数量/备注 -> 复核
-- 表格合计：57 行，库存总量 3426（库内原 49 行合计 94；入库流水 0 条、出库 51 条为凉亭历史，不动）
-- 公式求值：百叶片左 =294+34+1+4=333、百叶片右 =354+34+4=392、盖板1孔 =766+35=801、盖板2孔 =487+34=521
-- 8 个新品（库内原 49 行之外）：
--     YDJ222-159-1 / 水槽 / 2227
--     YDJ222-159-1 / 水槽 / 2229
--     YDG222-179 / 手摇机固定座 / 80
--     YDG222-162-2 / 百叶片左 / 0
--     YDG222-162-2 / 百叶片右 / 0
--     YDG222-167 / 百叶片盖板1孔 / 0
--     YDG222-167 / 百叶片盖板2孔 / 0
--     YDG222-167 / 百叶片盖板3孔 / 0
-- ============================================================

create temporary table _jintan_profiles_excel_import (
  profile_model text not null default '',
  profile_name  text not null,
  specification text not null default '',
  material      text not null default '',
  quantity      integer not null default 0,
  remarks       text not null default '',
  constraint _jintan_profiles_excel_import_key_unique unique (profile_model, profile_name, specification),
  constraint _jintan_profiles_excel_import_qty_non_negative check (quantity >= 0)
) on commit drop;

insert into pg_temp._jintan_profiles_excel_import (profile_model, profile_name, specification, material, quantity, remarks)
values
  ('YDJ222-166-1', '120*120立柱', '3000', '6063铝合金', 4, ''),
  ('YDJ222-156-1', '150*150立柱', '3000', '6063铝合金', 2, ''),
  ('', '叶片封盖右', '200*100*5', '6063铝合金', 0, ''),
  ('', '叶片封盖右', '', '6063铝合金', 0, ''),
  ('', '叶片封盖左', '200*57*5', '6063铝合金', 0, ''),
  ('', '叶片封盖左1', '', '6063铝合金', 0, ''),
  ('', '叶片封盖左2', '', '6063铝合金', 0, ''),
  ('YDJ222-176-1', '叶片弹簧转轴支架右', '105', '6063铝合金', 209, ''),
  ('YDJ222-158-1', '叶片支架右', '2700', '6063铝合金', 10, ''),
  ('YDJ222-158-1', '叶片支架左', '2700', '6063铝合金', 10, ''),
  ('YDJ222-163-2', '叶片横梁2', '2884', '6063铝合金', 0, ''),
  ('YDJ222-157-1', '叶片横梁右', '2830', '6063铝合金', 1, ''),
  ('YDJ222-157-1', '叶片横梁左', '2830', '6063铝合金', 1, ''),
  ('YDG222-176', '叶片转轴支架左', '55', '6063铝合金', 131, ''),
  ('YDJ222-168-1', '带毛刷盖板', '2884', '6063铝合金', 0, ''),
  ('YDJ222-163-3', '带电源横梁', '2884', '6063铝合金', 0, ''),
  ('YDJ222-163-1', '带轴叶片横梁1', '2884', '6063铝合金', 1, ''),
  ('YDG222-175-2', '底板', '220', '6063铝合金', 6, ''),
  ('YDJ222-175-5', '底板', '220', '6063铝合金', 2, ''),
  ('YDG222-172', '底脚套筒', '300', '6063铝合金', 6, ''),
  ('YDG222-174', '底脚套筒', '300', '6063铝合金', 15, ''),
  ('', '弹簧转轴支架盖板', '39*39*3.0', '6063铝合金', 0, ''),
  ('YDJ222-178-1', '手摇机固定座', '66', '6063铝合金', 108, ''),
  ('YDG222-177', '手摇机轴套', '60', '6063铝合金', 181, ''),
  ('YDJ222-157-2', '普通横梁', '2830', '6063铝合金', 2, ''),
  ('YDJ222-163-4', '普通横梁', '2884', '6063铝合金', 2, ''),
  ('YDG222-164', '普通盖板', '2884', '6063铝合金', 2, ''),
  ('YDJ222-159-1', '水槽', '2260', '6063铝合金', 7, ''),
  ('YDJ222-159-1', '水槽', '2227', '6063铝合金', 4, ''),
  ('YDJ222-159-1', '水槽', '2229', '6063铝合金', 35, ''),
  ('YDJ222-159-2', '水槽配件', '300*300*60', '6063铝合金', 9, ''),
  ('YDT-026', '水槽配件', '300*300*60', '6063铝合金', 9, ''),
  ('YDJ222-159-3', '水槽配件', '300*300*60', '6063铝合金', 9, ''),
  ('YDG222-167', '百叶片', '2853', '6063铝合金', 3, ''),
  ('YDG222-162', '百叶片', '2595', '6063铝合金', 34, ''),
  ('YDJ222-161-1', '角码', '242', '6063铝合金', 8, ''),
  ('YDJ222-161-2', '角码', '168', '6063铝合金', 9, ''),
  ('YDJ222-165-1', '连杆', '2750', '6063铝合金', 0, ''),
  ('YDJ222-160-1', '连杆', '2700', '6063铝合金', 2, ''),
  ('YDG222-175-1', '底板', '220', '6063铝合金', 4, ''),
  ('YDG222-173', '底脚套筒', '300', '6063铝合金', 11, ''),
  ('YDJ222-155-1', '120*120立柱', '3000', '6063铝合金', 4, ''),
  ('YDJ222-166-1', '120*120立柱', '2000', '6063铝合金', 0, ''),
  ('YDJ222-163-2', '叶片横梁2', '1974', '6063铝合金', 341, ''),
  ('YDJ222-168-1', '带毛刷盖板', '1974', '6063铝合金', 0, ''),
  ('YDJ222-163-3', '带电源横梁', '1974', '6063铝合金', 0, ''),
  ('YDJ222-163-1', '带轴叶片横梁1', '1974', '6063铝合金', 1, ''),
  ('YDJ222-163-4', '普通横梁', '1974', '6063铝合金', 0, ''),
  ('YDG222-164', '普通盖板', '1974', '6063铝合金', 0, ''),
  ('YDG222-167', '百叶片', '1943', '6063铝合金', 0, ''),
  ('YDJ222-165-1', '连杆', '1840', '6063铝合金', 0, ''),
  ('YDG222-179', '手摇机固定座', '80', '6063铝合金', 146, ''),
  ('YDG222-162-2', '百叶片左', '0', '6063铝合金', 333, ''),
  ('YDG222-162-2', '百叶片右', '0', '6063铝合金', 392, ''),
  ('YDG222-167', '百叶片盖板1孔', '0', '6063铝合金', 801, ''),
  ('YDG222-167', '百叶片盖板2孔', '0', '6063铝合金', 521, ''),
  ('YDG222-167', '百叶片盖板3孔', '0', '6063铝合金', 50, '');

-- A. 补缺失的型材资料（已存在则跳过；INSERT 触发器自动建 0 库存行）
insert into public.jintan_profiles_data (profile_model, profile_name, specification, material)
select distinct profile_model, profile_name, specification, material
from pg_temp._jintan_profiles_excel_import
on conflict (profile_model, profile_name, specification) do nothing;

-- B. 为既有型材资料兜底补 0 库存行（幂等，不覆盖已有数量）
insert into public.jintan_profiles_inventory (
  profile_data_id,
  profile_model,
  profile_name,
  specification,
  material
)
select id, profile_model, profile_name, specification, material
from public.jintan_profiles_data
on conflict (profile_data_id) do nothing;

-- C. 前置断言：57 行必须全部匹配到库存行，否则整体回滚
do $$
declare
  v_missing text;
  v_count integer;
begin
  select count(*) into v_count from pg_temp._jintan_profiles_excel_import;
  if v_count <> 57 then
    raise exception '表格行数异常，期望 57，实际 %', v_count;
  end if;

  select string_agg(format('%s / %s / %s', d.profile_model, d.profile_name, d.specification), '；')
    into v_missing
  from pg_temp._jintan_profiles_excel_import d
  where not exists (
    select 1
    from public.jintan_profiles_data pd
    join public.jintan_profiles_inventory inv on inv.profile_data_id = pd.id
    where pd.profile_model = d.profile_model
      and pd.profile_name = d.profile_name
      and pd.specification = d.specification
  );
  if v_missing is not null then
    raise exception '以下型材未匹配到库存行，取消更新：%', v_missing;
  end if;
end $$;

-- D. 按表格全量更新库存数量/备注（型号/名称/规格/材质快照以型材资料为准，不覆盖）
update public.jintan_profiles_inventory as inv
set quantity = d.quantity,
    remarks = d.remarks
from pg_temp._jintan_profiles_excel_import as d
join public.jintan_profiles_data as pd
  on pd.profile_model = d.profile_model
 and pd.profile_name = d.profile_name
 and pd.specification = d.specification
where inv.profile_data_id = pd.id;

-- E. 事后复核：57 行数量/备注必须与表格一致，否则整体回滚
do $$
declare
  v_mismatch text;
begin
  select string_agg(format('%s / %s / %s', d.profile_model, d.profile_name, d.specification), '；')
    into v_mismatch
  from pg_temp._jintan_profiles_excel_import d
  join public.jintan_profiles_data as pd
    on pd.profile_model = d.profile_model
   and pd.profile_name = d.profile_name
   and pd.specification = d.specification
  join public.jintan_profiles_inventory inv on inv.profile_data_id = pd.id
  where inv.quantity is distinct from d.quantity
     or inv.remarks is distinct from d.remarks;
  if v_mismatch is not null then
    raise exception '以下型材库存与表格不一致，取消提交：%', v_mismatch;
  end if;
end $$;
