import type { WorkflowStageConfig } from './reworkRepairFormUtils'
import { PencilSquareIcon, PlusCircleIcon } from '@heroicons/react/16/solid'

import { Button } from 'antd'
import DeleteButton from '@/ui/DeleteButton'

export interface ReworkRepairToolbarProps {
  activeStage: WorkflowStageConfig
  viewerDenied: boolean
  isDeleting: boolean
  selectedCount: number
  onCreate: () => void
  onProcess: () => void
  onDelete: () => void | Promise<void>
}

export default function ReworkRepairToolbar({
  activeStage,
  viewerDenied,
  isDeleting,
  selectedCount,
  onCreate,
  onProcess,
  onDelete,
}: ReworkRepairToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {activeStage.key === 'workshop'
        ? (
            <Button
              type="text"
              icon={<PlusCircleIcon className="size-4 text-green-500/80!" />}
              onClick={onCreate}
              disabled={viewerDenied}
            >
              新建返工返修记录
            </Button>
          )
        : null}
      <Button
        type="text"
        icon={<PencilSquareIcon className="size-4 text-yellow-500/80!" />}
        onClick={onProcess}
        disabled={viewerDenied}
      >
        {activeStage.actionLabel}
      </Button>
      <DeleteButton
        onConfirm={onDelete}
        isDeleting={isDeleting}
        count={selectedCount}
        title="删除返工返修记录"
        itemName="返工返修记录"
      />
    </div>
  )
}
