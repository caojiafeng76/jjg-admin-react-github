import { type ReactNode } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

export type SummaryTone = 'primary' | 'success' | 'warning' | 'error'

export interface SummaryStatItem {
  label: string
  value: number
  tone: SummaryTone
  /** 图标无需自带颜色类，chip 背景/前景色由 tone 统一控制 */
  icon: ReactNode
}

interface SelectedSummaryBarProps {
  selectedCount: number
  /** 当前页实际参与合计的条数；跨页选中时小于 selectedCount */
  matchedCount: number
  stats: SummaryStatItem[]
}

const TONE_CLASSES: Record<SummaryTone, { chip: string; value: string }> = {
  primary: { chip: 'bg-primary/10 text-primary', value: 'text-primary' },
  success: { chip: 'bg-success/10 text-success', value: 'text-success' },
  warning: { chip: 'bg-warning/10 text-warning', value: 'text-warning' },
  error: { chip: 'bg-error/10 text-error', value: 'text-error' },
}

/**
 * 选中摘要条（F1 通用化，源自物料转移单）。
 * 渐变主色底 + 辉光阴影，颜色全部走 antd token（@theme inline 桥接），
 * 暗色模式由 token 自动切换，无需 dark: 变体。
 */
export default function SelectedSummaryBar({
  selectedCount,
  matchedCount,
  stats,
}: SelectedSummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/10 via-info/10 to-primary/10 px-5 py-3 shadow-[0_8px_30px_color-mix(in_oklab,var(--jjg-color-primary)_12%,transparent)]">
      <span className="flex items-center gap-2 text-sm font-medium text-text-secondary">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CheckCircleIcon className="size-3.5" />
        </div>
        已选
        <span className="mx-1 text-lg font-bold text-primary tabular-nums">
          {selectedCount}
        </span>
        条
        {matchedCount < selectedCount ? (
          <span className="ml-1 text-xs text-warning">
            （当前页参与合计 {matchedCount} 条）
          </span>
        ) : null}
      </span>
      {stats.map((stat) => {
        const tone = TONE_CLASSES[stat.tone]
        return (
          <span
            key={stat.label}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg ${tone.chip}`}
            >
              {stat.icon}
            </div>
            {stat.label}：
            <span className={`text-xl font-bold tabular-nums ${tone.value}`}>
              {stat.value.toLocaleString()}
            </span>
          </span>
        )
      })}
    </div>
  )
}
