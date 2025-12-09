import { PlusCircleIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'

export default function AddButton({
  handleCreate,
}: {
  handleCreate: () => void
}) {
  return (
    <Button
      type="text"
      icon={<PlusCircleIcon className="size-4 text-green-500/80!" />}
      onClick={handleCreate}
    >
      添加
    </Button>
  )
}
