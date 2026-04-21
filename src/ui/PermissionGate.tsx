import type { ReactElement, ReactNode } from 'react'
import { cloneElement, isValidElement } from 'react'
import { usePermission } from '@/hooks/usePermission'

interface PermissionGateProps {
  /** 权限 key，对应 permissions 表中的 key 字段 */
  permissionKey: string
  /**
   * - `hide`（默认）：无权限时渲染为 null
   * - `disable`：无权限时对 children 注入 disabled={true}
   */
  mode?: 'hide' | 'disable'
  children: ReactNode
}

/**
 * 权限门控组件。
 * - `hide` 模式：无权限时不渲染 children
 * - `disable` 模式：无权限时对 children 注入 disabled={true}
 */
export default function PermissionGate({
  permissionKey,
  mode = 'hide',
  children,
}: PermissionGateProps) {
  const allowed = usePermission(permissionKey)

  if (allowed) return <>{children}</>

  if (mode === 'disable') {
    if (isValidElement(children)) {
      return cloneElement(children as ReactElement<{ disabled?: boolean }>, {
        disabled: true,
      })
    }
  }

  return null
}
