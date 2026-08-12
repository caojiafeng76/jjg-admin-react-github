-- 清理已移除的管理端通知功能数据库对象
-- 背景：前端通知功能已于 2026-08-12 从代码库整体删除（hooks/services/UI/权限注册）
-- 本脚本清理数据库侧残留：notifications 表、触发器、函数、realtime publication、权限种子数据
-- 注意：本脚本包含 DROP/DELETE，属于破坏性操作，执行前需用户明确确认

-- 1. 从 supabase_realtime publication 移除 notifications（还原 20260404120000 变更）
alter publication supabase_realtime drop table public.notifications;

-- 2. 删除挂在业务表上的通知触发器（还原 20260327230000 变更）
drop trigger if exists create_notification_for_production_order on public.production_orders;
drop trigger if exists create_notification_for_material_transfer on public.material_transfers;

-- 3. 删除 notifications 表上的 read_at 同步触发器
drop trigger if exists sync_notification_read_at on public.notifications;

-- 4. 删除触发器函数
drop function if exists public.create_notification_for_production_order();
drop function if exists public.create_notification_for_material_transfer();
drop function if exists public.sync_notification_read_at();

-- 5. 删除通知表（级联删除 RLS 策略与索引）
drop table if exists public.notifications cascade;

-- 6. 删除权限种子数据（先删 role_permissions 关联，再删权限行）
delete from public.role_permissions
where permission_id in (
  select id from public.permissions
  where key = 'feature:admin-notifications.view'
);

delete from public.permissions
where key = 'feature:admin-notifications.view';
