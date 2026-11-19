import type { ReactNode } from 'react'
import { PlusCircleIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'

export interface AddButtonProps {
  handleCreate: () => void
  permissionKey?: string
  noPermissionTip?: string
  disabled?: boolean
  /** 工具栏主操作默认 primary；个别非主入口场景可显式传 text */
  variant?: 'primary' | 'text'
  children?: ReactNode
}

export default function AddButton({
  handleCreate,
  permissionKey,
  noPermissionTip = '无新建权限',
  disabled,
  variant = 'primary',
  children,
}: AddButtonProps) {
  const allowed = usePermission(permissionKey ?? '')
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: permissionKey,
  })
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? viewerOperationTip : noPermissionTip
  const button = (
    <Button
      type={variant}
      icon={(
        <PlusCircleIcon
          className={variant === 'text' ? 'size-4 text-primary' : 'size-4'}
        />
      )}
      onClick={handleCreate}
      disabled={denied || disabled}
    >
      {children ?? '添加'}
    </Button>
  )
  return denied ? <Tooltip title={deniedTip}>{button}</Tooltip> : button
}
