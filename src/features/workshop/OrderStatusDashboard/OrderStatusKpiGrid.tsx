import { useMemo } from 'react'
import { Skeleton, theme, Typography } from 'antd'

import {
  EMPTY_ORDER_STATUS_DASHBOARD_KPIS,
  type OrderStatusDashboardKpis,
} from '@/services/apiOrderStatusDashboard'

const { Text, Title } = Typography

type StatusSegment = {
  color: string
  count: number
  label: string
  percent: number
}

/** 订单生产状态分布段（正常/预警/延期），占比保留 1 位小数；总数为 0 时全为 0 */
function buildStatusSegments(
  kpis: OrderStatusDashboardKpis,
  colors: { error: string; success: string; warning: string },
): StatusSegment[] {
  const items = [
    { label: '正常', count: kpis.normalOrderCount, color: colors.success },
    { label: '预警', count: kpis.warningOrderCount, color: colors.warning },
    { label: '延期', count: kpis.overdueOrderCount, color: colors.error },
  ]
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return items.map((item) => ({
    ...item,
    percent: total === 0 ? 0 : Math.round((item.count / total) * 1000) / 10,
  }))
}

function KpiNumberCard({
  label,
  sub,
  value,
}: {
  label: string
  sub: string
  value: number
}) {
  const {
    token: { colorText, colorTextSecondary, colorTextTertiary },
  } = theme.useToken()

  return (
    <div className="app-card flex h-full min-h-0 flex-col gap-1.5 p-3">
      <Text style={{ color: colorTextSecondary }} className="text-xs">
        {label}
      </Text>
      <Title
        level={2}
        className="!mb-0 !text-[22px] !font-bold tabular-nums leading-none"
        style={{ color: colorText }}
      >
        {value.toLocaleString('zh-CN')}
      </Title>
      <Text style={{ color: colorTextTertiary }} className="truncate text-[11px]">
        {sub}
      </Text>
    </div>
  )
}

function RateCard({ label, value }: { label: string; value: number }) {
  const {
    token: { colorPrimary, colorText, colorTextSecondary },
  } = theme.useToken()
  const clamped = Math.min(Math.max(value, 0), 100)

  return (
    <div className="app-card flex h-full min-h-0 flex-col gap-1.5 p-3">
      <Text style={{ color: colorTextSecondary }} className="text-xs">
        {label}
      </Text>
      <Title
        level={2}
        className="!mb-0 !text-[22px] !font-bold tabular-nums leading-none"
        style={{ color: colorText }}
      >
        {value.toFixed(1)}
        <span className="ml-0.5 text-sm font-semibold">%</span>
      </Title>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-auto h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: colorPrimary }}
        />
      </div>
    </div>
  )
}

/** 生产状态分布：通栏细条（图表配色随主题 token），保持低高度不挤压表格 */
function StatusDistributionBar({ kpis }: { kpis: OrderStatusDashboardKpis }) {
  const {
    token: { colorError, colorSuccess, colorTextSecondary, colorWarning },
  } = theme.useToken()
  const segments = useMemo(
    () =>
      buildStatusSegments(kpis, {
        error: colorError,
        success: colorSuccess,
        warning: colorWarning,
      }),
    [colorError, colorSuccess, colorWarning, kpis],
  )
  const total = segments.reduce((sum, segment) => sum + segment.count, 0)

  return (
    <div className="app-card flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
      <div className="flex items-baseline gap-2">
        <Text style={{ color: colorTextSecondary }} className="text-xs">
          生产状态分布
        </Text>
        <Text
          className="text-[11px] tabular-nums"
          style={{ color: colorTextSecondary }}
        >
          共 {total.toLocaleString('zh-CN')} 单
        </Text>
      </div>

      {/* 分段条 */}
      <div
        role="img"
        aria-label="生产状态分布占比"
        className="flex h-2 min-w-36 flex-1 basis-52 items-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700/60"
      >
        {segments.map((segment) =>
          segment.count === 0 ? null : (
            <div
              key={segment.label}
              className="h-full transition-all duration-500"
              style={{
                width: `${segment.percent}%`,
                backgroundColor: segment.color,
              }}
            />
          ),
        )}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {segment.label}
            </span>
            <span className="text-[11px] font-medium tabular-nums text-slate-700 dark:text-slate-200">
              {segment.count.toLocaleString('zh-CN')}
              <span className="ml-0.5 text-slate-400 dark:text-slate-500">
                {segment.percent}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-10 gap-2">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="app-card col-span-5 p-3 sm:col-span-2">
          <Skeleton active paragraph={{ rows: 1 }} title={false} />
        </div>
      ))}
      <div className="app-card col-span-10 px-4 py-3">
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      </div>
    </div>
  )
}

export function OrderStatusKpiGrid({
  kpis,
  loading = false,
}: {
  kpis?: OrderStatusDashboardKpis
  loading?: boolean
}) {
  if (loading) {
    return <KpiGridSkeleton />
  }

  const safeKpis = kpis ?? EMPTY_ORDER_STATUS_DASHBOARD_KPIS

  return (
    <div className="grid grid-cols-10 gap-2">
      <div className="col-span-5 sm:col-span-2">
        <KpiNumberCard
          label="订单总数"
          sub="按当前筛选条件"
          value={safeKpis.totalOrderCount}
        />
      </div>
      <div className="col-span-5 sm:col-span-2">
        <KpiNumberCard
          label="生产明细"
          sub="生产工单明细行数"
          value={safeKpis.productionItemCount}
        />
      </div>
      <div className="col-span-5 sm:col-span-2">
        <RateCard label="平均完工率" value={safeKpis.avgCompletionRate} />
      </div>
      <div className="col-span-5 sm:col-span-2">
        <RateCard label="平均成品率" value={safeKpis.avgYieldRate} />
      </div>
      <div className="col-span-5 sm:col-span-2">
        <KpiNumberCard
          label="物料转移"
          sub="转移单记录数"
          value={safeKpis.materialTransferCount}
        />
      </div>
      <div className="col-span-10">
        <StatusDistributionBar kpis={safeKpis} />
      </div>
    </div>
  )
}
