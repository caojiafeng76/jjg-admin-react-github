import { Button, Tooltip } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'
import { usePermission } from '@/hooks/usePermission'

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
  const allowed = usePermission(permissionKey ?? '')
  const denied = Boolean(permissionKey) && !allowed
  return (
    <Tooltip title={denied ? noPermissionTip : title}>
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
