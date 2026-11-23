import type { ReactNode } from 'react'

export interface SyneyDetailInfoItemProps {
  label: string
  children: ReactNode
}

/** 西尼订单/入库单详情页共用的头部信息项展示块 */
export default function SyneyDetailInfoItem({
  label,
  children,
}: SyneyDetailInfoItemProps) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {children}
      </div>
    </div>
  )
}
