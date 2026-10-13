import { Tag, Typography } from 'antd'

import { PROGRESS_STATUS_TAGS } from './productionSchedulingUtils'

const { Text, Title } = Typography

export interface ProductionSchedulingHeaderProps {
  progressStatus?: string
  onProgressStatusChange: (progressStatus: string | null) => void
}

export default function ProductionSchedulingHeader({
  progressStatus,
  onProgressStatusChange,
}: ProductionSchedulingHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-100/50 bg-white px-3 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="from-primary h-6 w-1 rounded-full bg-gradient-to-b via-blue-500 to-blue-400" />
          <Title
            level={4}
            style={{ margin: 0 }}
            className="!text-base !font-bold !text-slate-800 dark:!text-slate-100"
          >
            订单排产
          </Title>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Text
            type="secondary"
            className="mr-1 !text-xs font-medium tracking-wide text-slate-400 uppercase dark:!text-slate-500"
          >
            快速筛选
          </Text>
          {PROGRESS_STATUS_TAGS.map((tag) => {
            const active = (tag.value ?? null) === (progressStatus ?? null)
            return (
              <Tag.CheckableTag
                key={tag.label}
                checked={active}
                onChange={() => onProgressStatusChange(tag.value)}
                className={
                  '!m-0 rounded-full border px-3.5 !text-xs font-medium transition-all duration-200 ' +
                  (active
                    ? '!border-primary !from-primary !bg-gradient-to-r !to-blue-400 !text-white !shadow-sm !shadow-blue-200 dark:!shadow-blue-900/40'
                    : '!border-slate-200 !bg-white !text-slate-600 hover:!border-blue-300 hover:!bg-blue-50/50 hover:!text-blue-600 dark:!border-slate-600 dark:!bg-slate-800 dark:!text-slate-300 dark:hover:!border-blue-500 dark:hover:!bg-slate-700/60 dark:hover:!text-blue-400')
                }
              >
                {tag.label}
              </Tag.CheckableTag>
            )
          })}
        </div>
      </div>
    </div>
  )
}
