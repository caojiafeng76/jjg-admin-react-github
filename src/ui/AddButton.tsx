import { PlusCircleIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { usePermission } from '@/hooks/usePermission'

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
  const allowed = usePermission(permissionKey ?? '')
  const denied = Boolean(permissionKey) && !allowed
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
  return denied ? <Tooltip title={noPermissionTip}>{button}</Tooltip> : button
}
