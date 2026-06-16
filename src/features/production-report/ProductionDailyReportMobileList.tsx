import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

interface Props {
  loading: boolean
  data: ProductionDailyReportRow[]
}

function renderQualifiedRate(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }
  const percent = value * 100
  const tone =
    percent >= 99
      ? 'bg-emerald-50 text-emerald-600'
      : percent >= 95
        ? 'bg-blue-50 text-blue-600'
        : 'bg-amber-50 text-amber-600'
  const dot =
    percent >= 99
      ? 'bg-emerald-500'
      : percent >= 95
        ? 'bg-blue-500'
        : 'bg-amber-500'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm tabular-nums ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {percent.toFixed(2)}%
    </span>
  )
}

function renderDataCategory(value: string | null | undefined) {
  if (value !== 'A' && value !== 'B') {
    return null
  }
  const palette =
    value === 'A'
      ? 'bg-indigo-50 text-indigo-600'
      : 'bg-cyan-50 text-cyan-600'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${palette}`}
    >
      {value}
    </span>
  )
}

export default function ProductionDailyReportMobileList({
  loading,
  data,
}: Props) {
  if (!loading && data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50">
          <svg
            className="h-8 w-8 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-400">暂无日报数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((row) => {
        const dataCategoryBadge = renderDataCategory(row.dataCategory)
        return (
          <article
            key={row.key}
            className="group cursor-default overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.08)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="tabular-nums">{row.orderDate}</span>
                  {dataCategoryBadge}
                </div>
                <div className="mt-1 font-mono text-xl font-bold tracking-tight text-slate-900">
                  {row.projectNo}
                </div>
                <div className="mt-1 truncate text-sm text-slate-500">
                  {row.productModel} / {row.customerModel}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {row.operation}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 tabular-nums">
                    工时 {row.workHours.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                {renderQualifiedRate(row.qualifiedRate)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 text-sm text-slate-600">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  来料合格
                </div>
                <div className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {row.incomingQualifiedCount}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  成品合格
                </div>
                <div className="mt-1 font-semibold text-emerald-600 tabular-nums">
                  {row.qualifiedCount}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  不良数量
                </div>
                <div className="mt-1 font-semibold text-rose-600 tabular-nums">
                  {row.defectCount}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  长度
                </div>
                <div className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {row.lengthMm ?? '-'}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  原料不良
                </div>
                <div className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {row.rawMaterialDefectCount} /{' '}
                  {row.rawMaterialDefectWeightKg.toFixed(2)}kg
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  加工不良
                </div>
                <div className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {row.processingDefectCount} /{' '}
                  {row.processingDefectWeightKg.toFixed(2)}kg
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  外协不良
                </div>
                <div className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {row.outsourceDefectCount} /{' '}
                  {row.outsourceDefectWeightKg.toFixed(2)}kg
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  调机不良
                </div>
                <div className="mt-1 font-semibold text-slate-900 tabular-nums">
                  {row.setupDefectCount} /{' '}
                  {row.setupDefectWeightKg.toFixed(2)}kg
                </div>
              </div>
              <div className="col-span-2 rounded-xl bg-slate-50 p-2.5">
                <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                  操作人 / 调机负责人
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {row.employeeName} / {row.setupResponsible}
                </div>
              </div>
              {row.outsourceUnit !== '-' || row.outsourceDefectReason !== '-' ? (
                <div className="col-span-2 rounded-xl bg-slate-50 p-2.5">
                  <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                    外协信息
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {row.outsourceUnit} · {row.outsourceDefectReason}
                  </div>
                </div>
              ) : null}
              {row.remark !== '-' ? (
                <div className="col-span-2 rounded-xl bg-slate-50 p-2.5">
                  <div className="text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase">
                    备注
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {row.remark}
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
