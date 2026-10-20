import type { ProductionSchedulingSummary } from './productionSchedulingUtils'
import { ArrowPathIcon } from '@heroicons/react/16/solid'

import { Button } from 'antd'
import ExportButton from '@/ui/ExportButton'
import {

  renderQuantity,
} from './productionSchedulingUtils'

export interface ProductionSchedulingSummaryBarProps {
  summary: ProductionSchedulingSummary
  hasSelection: boolean
  selectedCount: number
  isFetching: boolean
  onExport: () => void
  onPreload: () => void
  onRefresh: () => void
}

export default function ProductionSchedulingSummaryBar({
  summary,
  hasSelection,
  selectedCount,
  isFetching,
  onExport,
  onPreload,
  onRefresh,
}: ProductionSchedulingSummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-1 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
        <span className="text-slate-500">
          订单数
          <b className="ml-1 font-semibold text-slate-800 tabular-nums dark:text-slate-100">
            {summary.totalOrders}
          </b>
        </span>
        <span className="text-slate-500">
          数量
          <b className="ml-1 font-semibold text-slate-800 tabular-nums dark:text-slate-100">
            {renderQuantity(summary.totalQuantity)}
          </b>
        </span>
        <span className="text-sky-600">
          进行中
          <b className="ml-1 tabular-nums">{summary.inProgressOrders}</b>
        </span>
        <span className="text-emerald-600">
          已完工
          <b className="ml-1 tabular-nums">{summary.finishedOrders}</b>
        </span>
        <span className="text-rose-600">
          延期
          <b className="ml-1 tabular-nums">{summary.delayedOrders}</b>
        </span>
        {hasSelection && (
          <span className="rounded-full bg-gradient-to-r from-blue-500/10 to-blue-400/10 px-2 py-0.5 text-xs font-medium text-blue-600 ring-1 ring-blue-200/50 dark:text-blue-400 dark:ring-blue-800/50">
            已选 {selectedCount} 条
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ExportButton
          handleExport={onExport}
          count={selectedCount}
          onPreload={onPreload}
        >
          {hasSelection ? `导出选中 (${selectedCount})` : '导出基础排产表'}
        </ExportButton>
        <Button
          type="text"
          icon={<ArrowPathIcon className="size-4" />}
          onClick={onRefresh}
          loading={isFetching}
          aria-label="刷新排产列表"
          className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400"
        />
      </div>
    </div>
  )
}
