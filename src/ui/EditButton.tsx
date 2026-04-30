import { Button, Tooltip } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'
import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { usePermission } from '@/hooks/usePermission'

const VIEWER_OPERATION_TIP = '查看员仅可查看数据'

export default function EditButton({
  title,
  handleEdit,
  permissionKey,
  noPermissionTip = '无编辑权限',
  disabled,
}: {
  title: string
  handleEdit: () => void
  permissionKey?: string
  noPermissionTip?: string
  disabled?: boolean
}) {
  const { role } = useAuth()
  const allowed = usePermission(permissionKey ?? '')
  const viewerDenied = isViewerRole(role)
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? VIEWER_OPERATION_TIP : noPermissionTip
  return (
    <Tooltip title={denied ? deniedTip : title}>
      <Button
        type="text"
        icon={<PencilSquareIcon className="size-4 text-yellow-500/80!" />}
        onClick={handleEdit}
        disabled={denied || disabled}
      >
        编辑
      </Button>
    </Tooltip>
  )
}
