import { XCircleIcon } from '@heroicons/react/16/solid'
import { Button, Popconfirm, Tooltip } from 'antd'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'

interface SharedProps {
  isDeleting: boolean
  count?: number // 要删除的数量
  title?: string // 自定义标题，默认为"删除{itemName}"
  itemName?: string // 删除对象名称，默认为"记录"，建议每个调用方显式传入
  permissionKey?: string // 删除权限 key，传入且无权限时禁用
  noPermissionTip?: string // 无权限提示文案
}

type Props
  = | (SharedProps & {
    onConfirm: () => void | Promise<void>
    onClick?: never
  })
  | (SharedProps & {
    onClick: () => void | Promise<void>
    onConfirm?: never
  })

export default function DeleteButton({
  onClick,
  onConfirm,
  isDeleting,
  count,
  title,
  itemName = '记录',
  permissionKey,
  noPermissionTip = '无删除权限',
}: Props) {
  const allowed = usePermission(permissionKey ?? '')
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: permissionKey,
  })
  const denied = viewerDenied || (Boolean(permissionKey) && !allowed)
  const deniedTip = viewerDenied ? viewerOperationTip : noPermissionTip
  const confirmTitle = title ?? `删除${itemName}`

  if (onClick) {
    const btn = (
      <Button
        type="text"
        loading={isDeleting}
        icon={<XCircleIcon className="size-4 text-red-500/80!" />}
        onClick={onClick}
        disabled={denied}
      >
        删除
      </Button>
    )
    return denied ? <Tooltip title={deniedTip}>{btn}</Tooltip> : btn
  }

  const description
    = count !== undefined && count > 0
      ? (
          <div>
            <p>
              确定删除选中的 <strong>{count}</strong> 条{itemName}吗？
            </p>
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">
              此操作不可撤销，关联的明细数据会一并删除。
            </p>
          </div>
        )
      : (
          `确定删除选中的${itemName}吗？此操作不可撤销。`
        )

  // 如果传入了 count 且为 0，则不弹出二次确认，直接执行 onConfirm
  if (count !== undefined && count <= 0) {
    const btn0 = (
      <Button
        type="text"
        loading={isDeleting}
        icon={<XCircleIcon className="size-4 text-red-500/80!" />}
        onClick={onConfirm}
        disabled={denied}
      >
        删除
      </Button>
    )
    return denied ? <Tooltip title={deniedTip}>{btn0}</Tooltip> : btn0
  }

  const trigger = (
    <Button
      type="text"
      icon={<XCircleIcon className="size-4 text-red-500/80!" />}
      disabled={denied}
    >
      删除
    </Button>
  )

  if (denied) {
    return <Tooltip title={deniedTip}>{trigger}</Tooltip>
  }

  return (
    <Popconfirm
      title={confirmTitle}
      description={description}
      onConfirm={() => onConfirm()}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ loading: isDeleting, danger: true }}
    >
      {trigger}
    </Popconfirm>
  )
}
