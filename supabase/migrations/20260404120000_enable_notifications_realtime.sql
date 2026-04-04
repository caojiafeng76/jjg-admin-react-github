-- 将 notifications 表加入 supabase_realtime publication
-- 这样前端 Supabase Realtime postgres_changes 订阅才能实时收到 INSERT/UPDATE 事件
alter publication supabase_realtime
add table public.notifications;