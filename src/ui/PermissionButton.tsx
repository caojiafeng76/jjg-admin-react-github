import type { ComponentProps } from 'react'
import { Button, Tooltip } from 'antd'
import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { usePermission } from '@/hooks/usePermission'

const VIEWER_OPERATION_TIP = '查看员仅可查看数据'

interface PermissionButtonProps extends ComponentProps<typeof Button> {
  /** 权限 key，对应 permissions 表中的 key 字段 */
  permissionKey: string
  /** 无权限时的 Tooltip 文案，默认为"无操作权限" */
  noPermissionTip?: string
}

/**
 * 带权限控制的按钮：无权限时显示为 disabled 状态并附带 Tooltip 提示。
 */
export default function PermissionButton({
  permissionKey,
  noPermissionTip = '无操作权限',
  disabled,
  ...rest
}: PermissionButtonProps) {
  const { role } = useAuth()
  const viewerDenied = isViewerRole(role)
  const allowed = usePermission(permissionKey)
  const denied = viewerDenied || !allowed
  const isDisabled = denied || disabled
  const deniedTip = viewerDenied ? VIEWER_OPERATION_TIP : noPermissionTip

  if (denied) {
    return (
      <Tooltip title={deniedTip}>
        <Button {...rest} disabled />
      </Tooltip>
    )
  }

  return <Button {...rest} disabled={isDisabled} />
}
