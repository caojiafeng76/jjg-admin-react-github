import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { queryConfig } from '@/config/queryClient'
import { getRoles } from '@/services/apiRoles'
import { ROLE_LABELS } from '@/config/access'
import type { AppRole } from '@/config/access'

/** 获取所有角色（内置 + 自定义），可被多模块共享。 */
export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    ...queryConfig.list,
  })
}

export interface RoleOption {
  label: string
  value: string
}

/**
 * 用于 Select / Radio 等控件的动态角色选项。
 * 后端 roles 表为单一数据源；若未加载完成，回退到 ROLE_LABELS 静态项以避免空选项。
 */
export function useRoleOptions(): {
  options: RoleOption[]
  isLoading: boolean
  getLabel: (key: string | null | undefined) => string
} {
  const { data: roles, isLoading } = useRolesQuery()

  return useMemo(() => {
    const list =
      roles && roles.length > 0
        ? roles.map((r) => ({ label: r.label, value: r.key }))
        : Object.entries(ROLE_LABELS).map(([value, label]) => ({
            label,
            value,
          }))

    const labelMap = new Map(list.map((o) => [o.value, o.label]))

    return {
      options: list,
      isLoading,
      getLabel: (key) => {
        if (!key) return ''
        return labelMap.get(key) ?? ROLE_LABELS[key as AppRole] ?? key
      },
    }
  }, [roles, isLoading])
}
