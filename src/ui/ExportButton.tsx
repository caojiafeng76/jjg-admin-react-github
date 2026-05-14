import { Button, Tooltip } from 'antd'
import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'

interface Props {
  handleExport: () => void
  disabled?: boolean
  loading?: boolean
  count?: number
  children?: React.ReactNode
  permissionKey?: string
  noPermissionTip?: string
}

export default function ExportButton({
  handleExport,
  disabled = false,
  loading = false,
  count,
  children,
  permissionKey,
  noPermissionTip = '无导出权限',
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
      icon={<ArrowDownTrayIcon className="size-4" />}
      onClick={handleExport}
      disabled={
        denied || disabled || loading || (count !== undefined && count === 0)
      }
      loading={loading}
    >
      {children || (
        <>
          导出Excel
          {count !== undefined && count > 0 && (
            <span className="ml-1 text-xs">({count})</span>
          )}
        </>
      )}
    </Button>
  )
  return denied ? <Tooltip title={deniedTip}>{btn}</Tooltip> : btn
}
