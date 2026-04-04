import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getAdminNotifications,
  getUnreadAdminNotificationCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
  type AdminNotification,
} from '@/services/apiNotifications'
import supabase from '@/services/supabase'
import { useMutationWithInvalidation } from './useMutationWithInvalidation'

const ADMIN_NOTIFICATIONS_KEY = 'admin-notifications' as const

export function useAdminNotifications(limit = 12, enabled = true) {
  return useQuery({
    queryKey: [ADMIN_NOTIFICATIONS_KEY, 'list', limit],
    queryFn: () => getAdminNotifications(limit),
    enabled,
    ...queryConfig.realtime,
  })
}

export function useUnreadAdminNotificationCount(enabled = true) {
  return useQuery({
    queryKey: [ADMIN_NOTIFICATIONS_KEY, 'unread-count'],
    queryFn: getUnreadAdminNotificationCount,
    enabled,
    ...queryConfig.realtime,
  })
}

export function useMarkAdminNotificationAsRead() {
  return useMutationWithInvalidation({
    mutationFn: markAdminNotificationAsRead,
    invalidateQueries: [[ADMIN_NOTIFICATIONS_KEY]],
  })
}

export function useMarkAllAdminNotificationsAsRead() {
  return useMutationWithInvalidation({
    mutationFn: markAllAdminNotificationsAsRead,
    invalidateQueries: [[ADMIN_NOTIFICATIONS_KEY]],
  })
}

export function useAdminNotificationsRealtime(
  enabled = true,
  onInsert?: (notification: AdminNotification) => void,
) {
  const queryClient = useQueryClient()
  // 用 ref 存回调，避免因函数引用变化重新创建 channel
  const onInsertRef = useRef(onInsert)
  onInsertRef.current = onInsert

  useEffect(() => {
    if (!enabled) {
      return
    }

    const channel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          queryClient.invalidateQueries({
            queryKey: [ADMIN_NOTIFICATIONS_KEY],
          })
          if (payload.eventType === 'INSERT' && onInsertRef.current) {
            onInsertRef.current(payload.new as AdminNotification)
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}