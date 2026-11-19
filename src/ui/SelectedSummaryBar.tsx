import type { ReactNode } from 'react'
import { CheckCircleIcon } from '@heroicons/react/16/solid'

export type SummaryTone = 'primary' | 'success' | 'warning' | 'error'

export interface SummaryStatItem {
  label: string
  value: number
  tone: SummaryTone
  /** 图标无需自带颜色类，chip 背景/前景色由 tone 统一控制 */
  icon: ReactNode
}

export interface SelectedSummaryBarProps {
  selectedCount: number
  /** 当前页实际参与合计的条数；跨页选中时小于 selectedCount */
  matchedCount: number
  stats: SummaryStatItem[]
}

const TONE_CLASSES: Record<SummaryTone, { chip: string, value: string }> = {
  primary: { chip: 'bg-primary/10 text-primary', value: 'text-primary' },
  success: { chip: 'bg-success/10 text-success', value: 'text-success' },
  warning: { chip: 'bg-warning/10 text-warning', value: 'text-warning' },
  error: { chip: 'bg-error/10 text-error', value: 'text-error' },
}

/**
 * 选中摘要条（F1 通用化，源自物料转移单）。
 * 采用克制扁平样式（1px 淡主色边框 + 淡主色底），颜色全部走 antd token（@theme inline 桥接），
 * 暗色模式由 token 自动切换。
 */
export default function SelectedSummaryBar({
  selectedCount,
  matchedCount,
  stats,
}: SelectedSummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 px-4 py-2">
      <span className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CheckCircleIcon className="size-4" />
        </span>
        已选
        <span className="mx-1 text-base font-bold text-primary tabular-nums">
          {selectedCount}
        </span>
        条
        {matchedCount < selectedCount
          ? (
              <span className="ml-1 text-xs text-warning">
                （当前页参与合计 {matchedCount} 条）
              </span>
            )
          : null}
      </span>
      {stats.map((stat) => {
        const tone = TONE_CLASSES[stat.tone]
        return (
          <span
            key={stat.label}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            <span
              className={`flex size-6 items-center justify-center rounded-lg ${tone.chip}`}
            >
              {stat.icon}
            </span>
            {stat.label}：
            <span className={`text-lg font-bold tabular-nums ${tone.value}`}>
              {stat.value.toLocaleString()}
            </span>
          </span>
        )
      })}
    </div>
  )
}
