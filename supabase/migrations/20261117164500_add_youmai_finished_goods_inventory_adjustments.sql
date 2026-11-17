-- ============================================================
-- 优迈成品库存调整流水 & 成品库存只读权限补充
--   youmai_finished_goods_inventory_adjustments  直接修改现有库存时由触发器写入
--   覆盖抽屉调整、成品库存页编辑、Excel 导入；出入库审核引起的库存变化已有流水，不重复记录
-- ============================================================

-- 审计记录不设外键：库存行或货品资料删除后仍保留历史调整流水
create table if not exists public.youmai_finished_goods_inventory_adjustments (
  id              uuid primary key default gen_random_uuid(),
  inventory_id    uuid not null,
  product_data_id uuid not null,
  material_code   text not null default '',
  material_name   text not null default '',
  model           text not null default '',
  specification   text not null default '',
  quantity_before numeric(12, 3) not null,
  quantity_after  numeric(12, 3) not null,
  difference      numeric(12, 3) generated always as (quantity_after - quantity_before) stored,
  remarks         text not null default '',
  operator_name   text not null default '',
  created_at      timestamptz not null default now()
);

comment on table public.youmai_finished_goods_inventory_adjustments is '优迈成品库存调整流水（直接修改现有库存时由触发器写入）';
comment on column public.youmai_finished_goods_inventory_adjustments.inventory_id is '对应优迈成品库存行 ID';
comment on column public.youmai_finished_goods_inventory_adjustments.product_data_id is '关联优迈货品资料 ID';
comment on column public.youmai_finished_goods_inventory_adjustments.difference is '差额 = 调整后 - 调整前';
comment on column public.youmai_finished_goods_inventory_adjustments.operator_name is '操作人姓名快照，非员工账号或后台操作时为空';

create index if not exists idx_youmai_fg_inventory_adjustments_product_created_at
  on public.youmai_finished_goods_inventory_adjustments (product_data_id, created_at desc);
create index if not exists idx_youmai_fg_inventory_adjustments_inventory_created_at
  on public.youmai_finished_goods_inventory_adjustments (inventory_id, created_at desc);

alter table public.youmai_finished_goods_inventory_adjustments enable row level security;
revoke all on public.youmai_finished_goods_inventory_adjustments from anon, authenticated;
grant select on public.youmai_finished_goods_inventory_adjustments to authenticated;

create policy "Youmai finished goods inventory adjustments select"
on public.youmai_finished_goods_inventory_adjustments for select to authenticated
using (
  public.is_admin()
  or public.current_user_has_permission('page:youmai-finished-goods-inventory')
  or public.current_user_has_permission('page:youmai-finished-goods-stock-out')
);

create or replace function public.record_youmai_finished_goods_inventory_adjustment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 出入库单审核/反审在自己的触发器里改 current_stock（深度 > 1），已有业务单据流水
  if pg_trigger_depth() > 1 then
    return null;
  end if;

  insert into public.youmai_finished_goods_inventory_adjustments (
    inventory_id,
    product_data_id,
    material_code,
    material_name,
    model,
    specification,
    quantity_before,
    quantity_after,
    remarks,
    operator_name
  )
  values (
    new.id,
    new.product_data_id,
    coalesce(new.material_code, ''),
    coalesce(new.material_name, ''),
    coalesce(new.model, ''),
    coalesce(new.specification, ''),
    old.current_stock,
    new.current_stock,
    coalesce(new.remarks, ''),
    coalesce(
      (select e.name from public.employees e where e.auth_user_id = auth.uid() limit 1),
      ''
    )
  );

  return null;
end;
$$;

revoke all on function public.record_youmai_finished_goods_inventory_adjustment() from public;

create trigger youmai_finished_goods_inventory_record_adjustment
after update of current_stock on public.youmai_finished_goods_inventory
for each row
when (old.current_stock is distinct from new.current_stock)
execute function public.record_youmai_finished_goods_inventory_adjustment();

-- 允许拥有优迈成品入库或出库页面权限的用户 SELECT 优迈成品库存（用于列表库存快照与详情抽屉只读展示）
create policy "Youmai finished goods inventory select for stock ops"
on public.youmai_finished_goods_inventory for select to authenticated
using (
  public.current_user_has_permission('page:youmai-finished-goods-stock-in')
  or public.current_user_has_permission('page:youmai-finished-goods-stock-out')
);
