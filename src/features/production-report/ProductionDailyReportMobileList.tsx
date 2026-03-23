import { Empty, Tag } from 'antd'

import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

interface Props {
  loading: boolean
  data: ProductionDailyReportRow[]
}

export default function ProductionDailyReportMobileList({
  loading,
  data,
}: Props) {
  if (!loading && data.length === 0) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无日报数据" />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((row) => {
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
                <div className="mt-2">
                  <Tag
                    color="processing"
                    className="mr-0 rounded-full px-3 py-1"
                  >
                    {row.operation}
                  </Tag>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
                <div className="text-[11px] tracking-[0.18em] text-slate-300 uppercase">
                  合格率
                </div>
                <div className="mt-1 text-base font-semibold">
                  {(row.qualifiedRate * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  合格 / 不良
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.qualifiedCount} / {row.defectCount}
                </div>
              </div>
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
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  加工不良
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.processingDefectCount} /{' '}
                  {row.processingDefectWeightKg.toFixed(2)}kg
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  长度
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.lengthMm ?? '-'}
                </div>
              </div>
              <div className="col-span-2 rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  备注
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.remark}
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
