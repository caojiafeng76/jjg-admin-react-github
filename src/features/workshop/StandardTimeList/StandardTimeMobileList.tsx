import { Button, Empty, Tag } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

import type { StandardTime } from '@/services/apiStandardTimes'

interface Props {
  loading: boolean
  data: StandardTime[]
  onEdit: (record: StandardTime) => void
}

export default function StandardTimeMobileList({
  loading,
  data,
  onEdit,
}: Props) {
  if (!loading && data.length === 0) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无理论工时" />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((record) => (
        <article
          key={record.id}
          className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400">
                {record.updated_at
                  ? `更新于 ${new Date(record.updated_at).toLocaleString('zh-CN')}`
                  : '暂无更新时间'}
              </div>
              <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                {record.model}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                工序：{record.operation}
              </div>
            </div>

            <Tag color="cyan">理论工时</Tag>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-[11px] tracking-[0.18em] uppercase text-slate-400">
                理论工时
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {record.theoretical_seconds}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-[11px] tracking-[0.18em] uppercase text-slate-400">
                创建时间
              </div>
              <div className="mt-1 font-medium text-slate-700">
                {record.created_at
                  ? new Date(record.created_at).toLocaleString('zh-CN')
                  : '-'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="primary"
              icon={<PencilSquareIcon className="size-4" />}
              onClick={() => onEdit(record)}
            >
              编辑理论工时
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}