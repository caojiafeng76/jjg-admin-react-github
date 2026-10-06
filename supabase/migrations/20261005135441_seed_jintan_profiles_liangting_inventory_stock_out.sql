-- ============================================================
-- 金檀木业型材库存与出库数据（来源：桌面《凉亭.xlsx》Sheet1）
-- 用户确认口径：
--   1) 目标结余 = 表格入库合计（含补建的 YDJ222-159-3、YDT-026）
--   2) 已录入的出库按同一表格计入，本次补录差额 = 表格出库 - 已录出库
--   3) 设置库存 = 表格入库 + 补录出库，出库由触发器同事务扣减
-- 说明：未在表格中的型材及其已录出库保持不变；入库数据不录入；
--       已录出库由脚本动态统计，重复执行只会校验不会重复扣减。
-- 表格合计：入库 83、出库 538；共 37 个型材。
-- ============================================================

create temporary table _jintan_liangting_import (
  profile_model text not null,
  profile_name  text not null,
  specification text not null,
  qty_in        integer not null,
  qty_out       integer not null,
  existing_out  integer not null default 0,
  new_out       integer not null default 0,
  constraint _jintan_liangting_import_key_unique unique (profile_model, profile_name, specification)
) on commit drop;

insert into pg_temp._jintan_liangting_import (profile_model, profile_name, specification, qty_in, qty_out)
values
  ('YDJ222-166-1', '120*120立柱', '3000', 4, 12),
  ('YDG222-174', '底脚套筒', '300', 2, 12),
  ('YDJ222-175-5', '底板', '220', 2, 12),
  ('YDJ222-161-2', '角码', '168', 2, 12),
  ('YDJ222-163-1', '带轴叶片横梁1', '2884', 1, 3),
  ('YDJ222-163-2', '叶片横梁2', '2884', 0, 3),
  ('YDJ222-163-3', '带电源横梁', '2884', 0, 3),
  ('YDJ222-163-4', '普通横梁', '2884', 2, 3),
  ('YDG222-164', '普通盖板', '2884', 2, 6),
  ('YDJ222-165-1', '连杆', '2750', 0, 2),
  ('YDG222-167', '百叶片', '2853', 3, 66),
  ('', '叶片封盖左1', '', 0, 63),
  ('', '叶片封盖左2', '', 0, 3),
  ('', '叶片封盖右', '', 0, 66),
  ('YDG222-177', '手摇机轴套', '60', 0, 3),
  ('YDJ222-178-1', '手摇机固定座', '66', 0, 3),
  ('YDJ222-168-1', '带毛刷盖板', '2884', 0, 2),
  ('YDJ222-156-1', '150*150立柱', '3000', 2, 6),
  ('YDG222-172', '底脚套筒', '300', 6, 6),
  ('YDG222-175-2', '底板', '220', 6, 6),
  ('YDJ222-161-1', '角码', '242', 2, 8),
  ('YDJ222-157-1', '叶片横梁左', '2830', 1, 2),
  ('YDJ222-157-1', '叶片横梁右', '2830', 1, 2),
  ('YDJ222-157-2', '普通横梁', '2830', 2, 4),
  ('YDJ222-158-1', '叶片支架左', '2700', 0, 2),
  ('YDJ222-158-1', '叶片支架右', '2700', 0, 2),
  ('YDJ222-159-1', '水槽', '2260', 7, 8),
  ('YDJ222-159-2', '水槽配件', '300*300*60', 9, 16),
  ('YDJ222-159-3', '水槽配件', '300*300*60', 9, 16),
  ('YDT-026', '水槽配件', '300*300*60', 9, 16),
  ('YDJ222-160-1', '连杆', '2700', 0, 2),
  ('YDG222-162', '百叶片', '2595', 11, 28),
  ('', '叶片封盖左', '200*57*5', 0, 28),
  ('', '叶片封盖右', '200*100*5', 0, 28),
  ('YDG222-176', '叶片转轴支架左', '55', 0, 28),
  ('YDJ222-176-1', '叶片弹簧转轴支架右', '105', 0, 28),
  ('', '弹簧转轴支架盖板', '39*39*3.0', 0, 28);

-- 前置断言 1：全部型材必须匹配到库存行
do $$
declare
  missing text;
begin
  select string_agg(d.profile_model || ' / ' || d.profile_name || ' / ' || d.specification, '；')
    into missing
  from pg_temp._jintan_liangting_import d
  where not exists (
    select 1
    from public.jintan_profiles_inventory inv
    where inv.profile_model = d.profile_model
      and inv.profile_name = d.profile_name
      and inv.specification = d.specification
  );
  if missing is not null then
    raise exception '以下型材未匹配到库存行，取消导入：%', missing;
  end if;
end $$;

-- 统计已录入的出库数量
update pg_temp._jintan_liangting_import d
set existing_out = coalesce((
  select sum(so.quantity)
  from public.jintan_profiles_stock_out so
  join public.jintan_profiles_inventory inv on inv.id = so.inventory_id
  where inv.profile_model = d.profile_model
    and inv.profile_name = d.profile_name
    and inv.specification = d.specification
), 0);

-- 前置断言 2：已录出库不得超过表格出库
do $$
declare
  over text;
begin
  select string_agg(d.profile_model || ' / ' || d.profile_name || '（已录 ' || d.existing_out || '，表格 ' || d.qty_out || '）', '；')
    into over
  from pg_temp._jintan_liangting_import d
  where d.existing_out > d.qty_out;
  if over is not null then
    raise exception '以下型材已录出库超过表格出库，取消导入：%', over;
  end if;
end $$;

-- 计算本次补录出库
update pg_temp._jintan_liangting_import
set new_out = qty_out - existing_out;

-- 第一步：库存 = 表格入库 + 本次补录出库
update public.jintan_profiles_inventory inv
set quantity = d.qty_in + d.new_out
from pg_temp._jintan_liangting_import d
where inv.profile_model = d.profile_model
  and inv.profile_name = d.profile_name
  and inv.specification = d.specification;

-- 第二步：补录出库差额（数据库触发器同事务扣减库存）
insert into public.jintan_profiles_stock_out (inventory_id, quantity, remarks)
select inv.id, d.new_out, '凉亭领料'
from pg_temp._jintan_liangting_import d
join public.jintan_profiles_inventory inv
  on inv.profile_model = d.profile_model
 and inv.profile_name = d.profile_name
 and inv.specification = d.specification
where d.new_out > 0;

-- 第三步：校验结余与累计出库
do $$
declare
  bad integer;
begin
  select count(*) into bad
  from pg_temp._jintan_liangting_import d
  join public.jintan_profiles_inventory inv
    on inv.profile_model = d.profile_model
   and inv.profile_name = d.profile_name
   and inv.specification = d.specification
  where inv.quantity <> d.qty_in;
  if bad > 0 then
    raise exception '结余校验失败：% 个型材结余与表格入库数不一致，已回滚', bad;
  end if;

  select count(*) into bad
  from pg_temp._jintan_liangting_import d
  join (
    select inv.profile_model, inv.profile_name, inv.specification,
           sum(so.quantity) as total_out
    from public.jintan_profiles_stock_out so
    join public.jintan_profiles_inventory inv on inv.id = so.inventory_id
    group by inv.profile_model, inv.profile_name, inv.specification
  ) t
    on t.profile_model = d.profile_model
   and t.profile_name = d.profile_name
   and t.specification = d.specification
  where t.total_out <> d.qty_out;
  if bad > 0 then
    raise exception '出库累计校验失败：% 个型材累计出库与表格出库不一致，已回滚', bad;
  end if;
end $$;
