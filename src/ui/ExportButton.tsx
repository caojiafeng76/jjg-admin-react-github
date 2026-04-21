import { Button, Tooltip } from 'antd'
import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { usePermission } from '@/hooks/usePermission'

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
  const denied = Boolean(permissionKey) && !allowed
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
  return denied ? <Tooltip title={noPermissionTip}>{btn}</Tooltip> : btn
}
