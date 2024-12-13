import { XCircleIcon } from '@heroicons/react/16/solid'
import { Button, Popconfirm, Tooltip } from 'antd'

type Props = {
  onConfirm: () => void
  isDeleting: boolean
  open: boolean
  showPopconfirm: () => void
  closeConfirm: () => void
}
export default function DeleteButton({
  onConfirm,
  isDeleting,
  open,
  showPopconfirm,
  closeConfirm,
}: Props) {
  return (
    <Tooltip title="请选择至少一条数据">
      <Popconfirm
        title="删除条目"
        description="确定删除这些条目吗?"
        open={open}
        okButtonProps={{ loading: isDeleting }}
        onConfirm={onConfirm}
        okText="确认"
        cancelText="取消"
        onCancel={closeConfirm}
      >
        <Button
          type="text"
          icon={<XCircleIcon className="size-4 !text-red-500/80" />}
          onClick={showPopconfirm}
        >
          删除
        </Button>
      </Popconfirm>
    </Tooltip>
  )
}
