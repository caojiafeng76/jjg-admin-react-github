import { PlusCircleIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'

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
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: permissionKey,
  })
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? viewerOperationTip : noPermissionTip
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
