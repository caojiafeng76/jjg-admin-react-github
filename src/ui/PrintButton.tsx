import { Button, Tooltip } from 'antd'
import { PrinterIcon } from '@heroicons/react/16/solid'
import { usePermission } from '@/hooks/usePermission'
import {
  useViewerOperationGuard,
  VIEWER_OPERATION_TIP,
} from '@/hooks/useViewerOperationGuard'

interface Props {
  handlePrint: () => void
  disabled?: boolean
  loading?: boolean
  count?: number
  children?: React.ReactNode
  permissionKey?: string
  noPermissionTip?: string
}

export default function PrintButton({
  handlePrint,
  disabled = false,
  loading = false,
  count,
  children,
  permissionKey,
  noPermissionTip = '无打印权限',
}: Props) {
  const { viewerDenied } = useViewerOperationGuard()
  const allowed = usePermission(permissionKey ?? '')
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? VIEWER_OPERATION_TIP : noPermissionTip
  const btn = (
    <Button
      type="text"
      icon={<PrinterIcon className="size-4" />}
      onClick={handlePrint}
      disabled={
        denied || disabled || loading || (count !== undefined && count === 0)
      }
      loading={loading}
    >
      {children || (
        <>
          打印
          {count !== undefined && count > 0 && (
            <span className="ml-1 text-xs">({count})</span>
          )}
        </>
      )}
    </Button>
  )
  return denied ? <Tooltip title={deniedTip}>{btn}</Tooltip> : btn
}
