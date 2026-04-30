import { Button, Tooltip } from 'antd'
import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { usePermission } from '@/hooks/usePermission'

const VIEWER_OPERATION_TIP = '查看员仅可查看数据'

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
  const { role } = useAuth()
  const allowed = usePermission(permissionKey ?? '')
  const viewerDenied = isViewerRole(role)
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? VIEWER_OPERATION_TIP : noPermissionTip
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
