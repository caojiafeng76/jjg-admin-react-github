import type { ReactNode } from 'react'

/**
 * 状态徽章通用组件（S2 UI 改版）
 *
 * 规格（docs/UI设计调研与改版指南.md §6.1.4）：
 * 状态列统一 pill 徽章 = 圆角 + 语义色浅底 + 色点，
 * 全站语义一致：成功=绿 / 警告=琥珀 / 危险=红 / 中性=灰。
 *
 * 语义色走 antd token（@theme inline 桥接 --color-success/warning/error），
 * 暗色模式由 token 自动切换，无需 dark: 变体；
 * 中性灰无对应 token，保留 slate 类 + dark: 变体。
 */

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

export interface StatusPillProps {
  tone: StatusTone
  children: ReactNode
  /** 前置色点，默认 true */
  dot?: boolean
  className?: string
}

const TONE_CLASSES: Record<StatusTone, { pill: string; dot: string }> = {
  success: { pill: 'bg-success/10 text-success', dot: 'bg-success' },
  warning: { pill: 'bg-warning/10 text-warning', dot: 'bg-warning' },
  danger: { pill: 'bg-error/10 text-error', dot: 'bg-error' },
  neutral: {
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
}

export default function StatusPill({
  tone,
  children,
  dot = true,
  className = '',
}: StatusPillProps) {
  const classes = TONE_CLASSES[tone]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${classes.pill} ${className}`}
    >
      {dot ? <span className={`size-1.5 shrink-0 rounded-full ${classes.dot}`} /> : null}
      {children}
    </span>
  )
}