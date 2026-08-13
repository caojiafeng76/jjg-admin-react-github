import { useMemo } from 'react'
import { Alert, Button, Skeleton, theme, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import {
  getDashboardKpis,
  KPI_TREND_DAYS,
  type DashboardKpi,
} from '@/services/apiDashboard'

const { Text, Title } = Typography

export const DASHBOARD_KPIS_KEY = 'dashboard-kpis' as const

/** 趋势迷你图（内联 SVG，无第三方图表依赖） */
function TrendSparkline({ data }: { data: number[] }) {
  const {
    token: { colorPrimary },
  } = theme.useToken()

  const path = useMemo(() => {
    const width = 120
    const height = 32
    const max = Math.max(...data, 1)
    const points = data.map((value, index) => {
      const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * (width - 2) + 1
      const y = height - 2 - (value / max) * (height - 4)
      return [x, y] as const
    })

    const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ')
    const area = `${line} L${width - 1},${height} L1,${height} Z`

    return { line, area, points }
  }, [data])

  return (
    <svg
      viewBox="0 0 120 32"
      className="h-8 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={path.area} fill={colorPrimary} opacity={0.08} />
      <path
        d={path.line}
        fill="none"
        stroke={colorPrimary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {path.points.length > 0 && (
        <circle
          cx={path.points[path.points.length - 1][0]}
          cy={path.points[path.points.length - 1][1]}
          r={2}
          fill={colorPrimary}
        />
      )}
    </svg>
  )
}

/** 环比标签：后 7 天 vs 前 7 天新增量变化 */
function DeltaLabel({ deltaPercent }: { deltaPercent: number | null }) {
  const {
    token: { colorSuccess, colorError, colorTextTertiary },
  } = theme.useToken()

  if (deltaPercent === null) {
    return (
      <Text style={{ color: colorTextTertiary }} className="text-xs">
        新增数据不足，暂无比对
      </Text>
    )
  }

  const isUp = deltaPercent >= 0
  const color = deltaPercent === 0 ? colorTextTertiary : isUp ? colorSuccess : colorError
  const arrow = deltaPercent === 0 ? '' : isUp ? '▲' : '▼'
  const text = deltaPercent === 0 ? '持平' : `${Math.abs(deltaPercent)}%`

  return (
    <Text style={{ color }} className="text-xs font-medium tabular-nums">
      {arrow} {text}
      <span className="opacity-70"> 较前 7 天</span>
    </Text>
  )
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const {
    token: { colorText, colorTextSecondary, colorTextTertiary },
  } = theme.useToken()

  return (
    <div className="app-card flex flex-col gap-2 p-4">
      <Text style={{ color: colorTextSecondary }} className="text-sm">
        {kpi.label}
      </Text>
      <div className="flex items-baseline justify-between gap-2">
        <Title
          level={2}
          className="!mb-0 !text-[28px] !font-bold tabular-nums"
          style={{ color: colorText }}
        >
          {kpi.value.toLocaleString('zh-CN')}
        </Title>
        <DeltaLabel deltaPercent={kpi.deltaPercent} />
      </div>
      <TrendSparkline data={kpi.trend} />
      <Text
        style={{ color: colorTextTertiary }}
        className="text-xs"
      >
        近 {KPI_TREND_DAYS} 天每日新增
      </Text>
    </div>
  )
}

function KpiGridSkeleton() {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="app-card p-4">
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const {
    token: { colorTextSecondary },
  } = theme.useToken()
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [DASHBOARD_KPIS_KEY],
    queryFn: ({ signal }) => getDashboardKpis(signal),
    ...queryConfig.list,
  })

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 overflow-auto p-1">
        <KpiGridSkeleton />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert
          type="error"
          showIcon
          message="看板数据加载失败"
          description={(error as Error)?.message || '请稍后重试'}
          action={
            <Button size="small" loading={isFetching} onClick={() => refetch()}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-1">
      <div className="flex items-baseline justify-between">
        <Title level={4} className="!mb-0" style={{ color: colorTextSecondary }}>
          经营概览
        </Title>
        <Text className="text-xs" style={{ color: colorTextSecondary }}>
          数据实时统计，趋势为近 14 天每日新增
        </Text>
      </div>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
      >
        {data.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </div>
    </div>
  )
}
