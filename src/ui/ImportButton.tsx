import { ArrowUpTrayIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { usePermission } from '@/hooks/usePermission'

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
  const allowed = usePermission(permissionKey ?? '')
  const denied = Boolean(permissionKey) && !allowed
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
  return denied ? <Tooltip title={noPermissionTip}>{btn}</Tooltip> : btn
}
