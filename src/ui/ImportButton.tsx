import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { usePermission } from '@/hooks/usePermission'

const VIEWER_OPERATION_TIP = '查看员仅可查看数据'

interface Props {
  onClick: () => void
  children?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  permissionKey?: string
  noPermissionTip?: string
}

export default function ImportButton({
  onClick,
  children,
  disabled = false,
  loading = false,
  permissionKey,
  noPermissionTip = '无导入权限',
}: Props) {
  const { role } = useAuth()
  const allowed = usePermission(permissionKey ?? '')
  const viewerDenied = isViewerRole(role)
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? VIEWER_OPERATION_TIP : noPermissionTip
  const btn = (
    <Button
      type="text"
      icon={<ArrowUpTrayIcon className="size-4 text-sky-500/80!" />}
      onClick={onClick}
      disabled={denied || disabled}
      loading={loading}
    >
      {children || '导入 Excel'}
    </Button>
  )
  return denied ? <Tooltip title={deniedTip}>{btn}</Tooltip> : btn
}
