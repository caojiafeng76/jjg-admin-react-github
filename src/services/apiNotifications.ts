import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export type AdminNotificationEntityType =
  | 'production_order'
  | 'material_transfer'

export type AdminNotificationActionType = 'create' | 'update'

export interface AdminNotification {
  id: string
  actor_employee_id: string
  actor_name: string
  entity_type: AdminNotificationEntityType
  entity_id: string
  action_type: AdminNotificationActionType
  is_read: boolean
  read_at: string | null
  created_at: string
}

type NotificationsTable = {
  from: (table: string) => any
}

function notificationsTable() {
  return (supabase as unknown as NotificationsTable).from('notifications')
}

export async function getAdminNotifications(limit = 12) {
  const { data, error } = await notificationsTable()
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw handleApiError(error, '获取通知列表失败')
  }

  return (data || []) as AdminNotification[]
}

export async function getUnreadAdminNotificationCount() {
  const { count, error } = await notificationsTable()
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) {
    throw handleApiError(error, '获取未读通知数量失败')
  }

  return count || 0
}

export async function markAdminNotificationAsRead(id: string) {
  const { error } = await notificationsTable()
    .update({ is_read: true })
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '标记通知已读失败')
  }
}

export async function markAllAdminNotificationsAsRead() {
  const { error } = await notificationsTable()
    .update({ is_read: true })
    .eq('is_read', false)

  if (error) {
    throw handleApiError(error, '全部标记已读失败')
  }
}