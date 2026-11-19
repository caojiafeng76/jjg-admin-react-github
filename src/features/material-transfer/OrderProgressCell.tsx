import type { MaterialTransferOrderProgress } from '@/services/apiMaterialTransfers'
import { Progress } from 'antd'
import { memo } from 'react'

import StatusPill from '@/ui/StatusPill'

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
  return progress.isCompleted
    ? <StatusPill tone="success">完工</StatusPill>
    : <StatusPill tone="neutral">未完工</StatusPill>
}

export const OrderStatusCell = memo(OrderStatusCellBase)
