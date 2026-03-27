import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getAdminNotifications,
  getUnreadAdminNotificationCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
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

export function useAdminNotificationsRealtime(enabled = true) {
  const queryClient = useQueryClient()

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
        () => {
          queryClient.invalidateQueries({
            queryKey: [ADMIN_NOTIFICATIONS_KEY],
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])
}