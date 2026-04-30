import { PlusCircleIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { usePermission } from '@/hooks/usePermission'

const VIEWER_OPERATION_TIP = '查看员仅可查看数据'

export default function AddButton({
  handleCreate,
  permissionKey,
  noPermissionTip = '无新建权限',
  disabled,
}: {
  handleCreate: () => void
  permissionKey?: string
  noPermissionTip?: string
  disabled?: boolean
}) {
  const { role } = useAuth()
  const allowed = usePermission(permissionKey ?? '')
  const viewerDenied = isViewerRole(role)
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? VIEWER_OPERATION_TIP : noPermissionTip
  const button = (
    <Button
      type="text"
      icon={<PlusCircleIcon className="size-4 text-green-500/80!" />}
      onClick={handleCreate}
      disabled={denied || disabled}
    >
      添加
    </Button>
  )
  return denied ? <Tooltip title={deniedTip}>{button}</Tooltip> : button
}
