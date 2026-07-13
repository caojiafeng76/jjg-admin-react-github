import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'
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

export default function ImportButton({
  onClick,
  children,
  disabled = false,
  loading = false,
  permissionKey,
  noPermissionTip = '无导入权限',
  onPreload,
}: Props) {
  const allowed = usePermission(permissionKey ?? '')
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: permissionKey,
  })
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? viewerOperationTip : noPermissionTip
  const btn = (
    <Button
      type="text"
      icon={<ArrowUpTrayIcon className="size-4 text-sky-500/80!" />}
      onClick={onClick}
      onMouseEnter={onPreload}
      onFocus={onPreload}
      disabled={denied || disabled}
      loading={loading}
    >
      {children || '导入 Excel'}
    </Button>
  )
  return denied ? <Tooltip title={deniedTip}>{btn}</Tooltip> : btn
}
