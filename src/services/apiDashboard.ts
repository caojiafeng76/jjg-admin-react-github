import dayjs from 'dayjs'
import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface DashboardKpi {
  key: string
  label: string
  /** 总数（全量 count） */
  value: number
  /** 近 14 天每日新增量（索引 0 = 最早一天） */
  trend: number[]
  /** 环比：后 7 天 vs 前 7 天新增量变化百分比；前 7 天为 0 时返回 null */
  deltaPercent: number | null
}

interface KpiSource {
  key: string
  label: string
  table: 'sales_orders' | 'production_orders' | 'syney-pos' | 'material_transfers' | 'employees'
}

/** 首页 KPI 数据源：5 张核心业务表，均为登录用户可读的 count 聚合 */
const KPI_SOURCES: KpiSource[] = [
  { key: 'workshop-orders', label: '车间订单', table: 'sales_orders' },
  { key: 'production-orders', label: '生产工单', table: 'production_orders' },
  { key: 'syney-pos', label: '西尼订单', table: 'syney-pos' },
  { key: 'material-transfers', label: '物料转移', table: 'material_transfers' },
  { key: 'employees', label: '员工', table: 'employees' },
]

export const KPI_TREND_DAYS = 14

/**
 * 把 created_at 时间戳列表聚合为近 N 天的每日计数。
 * @param dates created_at 原始值（可能为 null）
 * @param days 桶数量，索引 0 = 最早一天（今天 - days + 1），索引最后 = 今天
 * @returns 每日计数数组
 */
export function buildDailyTrend(
  dates: (string | null)[],
  days: number,
): number[] {
  const buckets = Array.from({ length: days }, () => 0)
  const today = dayjs().startOf('day')
  const earliest = today.subtract(days - 1, 'day')

  for (const date of dates) {
    if (!date) continue
    const day = dayjs(date)
    if (!day.isValid() || day.isBefore(earliest, 'day') || day.isAfter(today, 'day')) {
      continue
    }
    const index = day.diff(earliest, 'day')
    buckets[index] += 1
  }

  return buckets
}

/**
 * 计算环比：后一半 vs 前一半的变化百分比。
 * @param trend 每日计数数组，须为偶数长度（如 14 → 后 7 天 vs 前 7 天）
 * @returns 百分比（保留 1 位小数）；前一半合计为 0 时返回 null
 */
export function computeDeltaPercent(trend: number[]): number | null {
  if (trend.length < 2 || trend.length % 2 !== 0) return null
  const half = trend.length / 2
  const previous = trend.slice(0, half).reduce((sum, n) => sum + n, 0)
  const current = trend.slice(half).reduce((sum, n) => sum + n, 0)
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** 取 ISO 日期，便于 count 过滤与分组口径一致 */
function toIsoDate(day: dayjs.Dayjs) {
  return day.format('YYYY-MM-DD')
}

/**
 * 首页决策看板聚合查询：5 张业务表的全量总数 + 近 14 天每日新增。
 * 每表 1 次 count + 1 次 created_at 扫描，并行执行。
 */
export async function getDashboardKpis(signal?: AbortSignal): Promise<DashboardKpi[]> {
  const startDate = toIsoDate(dayjs().startOf('day').subtract(KPI_TREND_DAYS - 1, 'day'))

  const results = await Promise.all(
    KPI_SOURCES.map(async (source): Promise<DashboardKpi> => {
      let countQuery = supabase
        .from(source.table)
        .select('id', { count: 'exact', head: true })
      let trendQuery = supabase
        .from(source.table)
        .select('created_at')
        .gte('created_at', startDate)

      if (signal) {
        countQuery = countQuery.abortSignal(signal)
        trendQuery = trendQuery.abortSignal(signal)
      }

      const [countResult, trendResult] = await Promise.all([countQuery, trendQuery])

      if (countResult.error) {
        throw handleApiError(countResult.error, `${source.label}数量统计失败`)
      }
      if (trendResult.error) {
        throw handleApiError(trendResult.error, `${source.label}趋势统计失败`)
      }

      const dates = (trendResult.data ?? []).map((row) => row.created_at as string | null)
      const trend = buildDailyTrend(dates, KPI_TREND_DAYS)

      return {
        key: source.key,
        label: source.label,
        value: countResult.count ?? 0,
        trend,
        deltaPercent: computeDeltaPercent(trend),
      }
    }),
  )

  return results
}
