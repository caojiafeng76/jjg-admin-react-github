import { Empty, Tag } from 'antd'

import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

interface Props {
  loading: boolean
  data: ProductionDailyReportRow[]
  operations: string[]
}

export default function ProductionDailyReportMobileList({
  loading,
  data,
  operations,
}: Props) {
  if (!loading && data.length === 0) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无日报数据" />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((row) => {
        const topOperations = operations
          .map((operation) => ({
            operation,
            quantity: row.operationQuantities[operation] || 0,
          }))
          .filter((item) => item.quantity > 0)
          .slice(0, 3)

        return (
          <article
            key={row.key}
            className="border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
            style={{ borderRadius: 24 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">{row.orderDate}</div>
                <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                  {row.projectNo}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {row.productModel} / {row.customerModel}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
                <div className="text-[11px] tracking-[0.18em] text-slate-300 uppercase">
                  工时
                </div>
                <div className="mt-1 text-base font-semibold">
                  {row.workHours.toFixed(2)} h
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {topOperations.length > 0 ? (
                topOperations.map((item) => (
                  <Tag
                    key={item.operation}
                    color="processing"
                    className="mr-0 rounded-full px-3 py-1"
                  >
                    {item.operation} {item.quantity}
                  </Tag>
                ))
              ) : (
                <Tag color="default" className="mr-0 rounded-full px-3 py-1">
                  暂无工序数量
                </Tag>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  操作人
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.employeeName}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  原料不良
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.rawMaterialDefectCount} /{' '}
                  {row.rawMaterialDefectWeightKg.toFixed(2)}kg
                </div>
              </div>
              <div className="col-span-2 rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  加工不良
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.processingDefectCount} /{' '}
                  {row.processingDefectWeightKg.toFixed(2)}kg
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
