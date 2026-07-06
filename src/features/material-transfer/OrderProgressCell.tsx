import { memo } from 'react'
import { Progress, Tag } from 'antd'

import type { MaterialTransferOrderProgress } from '@/services/apiMaterialTransfers'

interface ProgressCellProps {
  progress: MaterialTransferOrderProgress | undefined
}

function OrderProgressCellBase({ progress }: ProgressCellProps) {
  if (!progress || progress.completionRate == null) {
    return <span className="text-slate-400">-</span>
  }
  const percent = Math.min(progress.completionRate, 999)
  return (
    <Progress
      percent={percent}
      size="small"
      status={progress.isCompleted ? 'success' : 'active'}
      format={() => `${progress.completionRate!.toFixed(1)}%`}
      className="m-0 min-w-[96px]"
    />
  )
}

export const OrderProgressCell = memo(OrderProgressCellBase)

function OrderStatusCellBase({ progress }: ProgressCellProps) {
  if (!progress || progress.orderQuantity == null) {
    return <span className="text-slate-400">-</span>
  }
  return progress.isCompleted ? (
    <Tag color="green" className="m-0">
      完工
    </Tag>
  ) : (
    <Tag color="default" className="m-0">
      未完工
    </Tag>
  )
}

export const OrderStatusCell = memo(OrderStatusCellBase)