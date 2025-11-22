import { XCircleIcon } from '@heroicons/react/16/solid'
import { Button, Popconfirm } from 'antd'

type Props = {
  onConfirm: () => void
  isDeleting: boolean
}

export default function DeleteButton({ onConfirm, isDeleting }: Props) {
  return (
    <Popconfirm
      title="删除订单"
      description="确定删除选中的订单吗?此操作不可撤销。"
      onConfirm={onConfirm}
      okText="确认"
      cancelText="取消"
      okButtonProps={{ loading: isDeleting, danger: true }}
    >
      <Button
        type="text"
        icon={<XCircleIcon className="size-4 !text-red-500/80" />}
      >
        删除
      </Button>
    </Popconfirm>
  )
}
