import { Button, Tooltip } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

export default function EditButton({
  title,
  handleEdit,
}: {
  title: string
  handleEdit: () => void
}) {
  return (
    <Tooltip title={title}>
      <Button
        type="text"
        icon={<PencilSquareIcon className="size-4 !text-yellow-500/80" />}
        onClick={handleEdit}
      >
        编辑
      </Button>
    </Tooltip>
  )
}
