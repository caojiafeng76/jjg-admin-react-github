import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'

import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'

interface Props {
  onClick: () => void
  children?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  permissionKey?: string
  noPermissionTip?: string
  onPreload?: () => void
}

export default function DownloadTemplateButton({
  onClick,
  children,
  disabled = false,
  loading = false,
  permissionKey,
  noPermissionTip = '无下载模板权限',
  onPreload,
}: Props) {
  const allowed = usePermission(permissionKey ?? '')
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: permissionKey,
  })
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? viewerOperationTip : noPermissionTip
  const button = (
    <Button
      type="text"
      icon={<ArrowDownTrayIcon className="size-4 text-cyan-600/80!" />}
      onClick={onClick}
      onMouseEnter={onPreload}
      onFocus={onPreload}
      disabled={denied || disabled}
      loading={loading}
    >
      {children || '下载模板'}
    </Button>
  )

  return denied ? <Tooltip title={deniedTip}>{button}</Tooltip> : button
}
