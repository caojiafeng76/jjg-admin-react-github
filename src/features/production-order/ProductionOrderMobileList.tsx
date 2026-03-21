import { Button, Empty, Tag } from 'antd'
import { EyeIcon } from '@heroicons/react/24/outline'

import type { ProductionOrderListItem } from '@/services/apiProductionOrders'

interface Props {
  loading: boolean
  data: ProductionOrderListItem[]
  onView: (record: ProductionOrderListItem) => void
  onSelect?: (keys: React.Key[]) => void
  selectedRowKeys?: React.Key[]
}

function renderEfficiency(value: number | null) {
  if (value === null || value === undefined) {
    return '-'
  }

  return `${(value * 100).toFixed(2)}%`
}

export default function ProductionOrderMobileList({
  loading,
  data,
  onView,
  onSelect,
  selectedRowKeys = [],
}: Props) {
  if (!loading && data.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无工单" />
  }

  return (
    <div className="space-y-3">
      {data.map((record) => {
        const selected = selectedRowKeys.includes(record.id)

        return (
          <article
            key={record.id}
            onClick={() => onSelect?.(selected ? [] : [record.id])}
            className={
              selected
                ? 'rounded-3xl border border-slate-900 bg-slate-900 px-4 py-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]'
                : 'rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className={selected ? 'text-xs text-slate-300' : 'text-xs text-slate-400'}>
                  {record.order_date}
                </div>
                <div className="mt-1 text-lg font-bold tracking-tight">
                  {record.employee?.name || '未分配员工'}
                </div>
              </div>
              <Tag color={record.hasZeroStandardQualifiedItem ? 'error' : 'processing'}>
                {record.hasZeroStandardQualifiedItem ? '待修正工时' : '正常'}
              </Tag>
            </div>

            <div className={selected ? 'mt-4 grid grid-cols-2 gap-3 text-sm text-slate-100' : 'mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600'}>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">出勤工时</div>
                <div className="mt-1 text-base font-semibold">{record.work_hours} h</div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">合格工时</div>
                <div className="mt-1 text-base font-semibold">
                  {record.total_qualified_hours?.toFixed(2) || '-'} h
                </div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">效率</div>
                <div className="mt-1 text-base font-semibold">{renderEfficiency(record.efficiency)}</div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">备注</div>
                <div className="mt-1 line-clamp-2 text-sm font-medium">{record.remark || '无'}</div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type={selected ? 'default' : 'primary'}
                ghost={selected}
                icon={<EyeIcon className="size-4" />}
                onClick={(event) => {
                  event.stopPropagation()
                  onView(record)
                }}
              >
                查看详情
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}