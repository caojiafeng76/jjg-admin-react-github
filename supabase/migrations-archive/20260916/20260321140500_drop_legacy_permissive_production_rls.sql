-- 清理历史遗留的宽松 RLS 策略。
-- 这些策略为 roles=public 且 using=true，会覆盖严格员工隔离规则。
drop policy if exists "启用生产工单表的RLS" on public.production_orders;
drop policy if exists "启用工序明细表的RLS" on public.production_order_items;