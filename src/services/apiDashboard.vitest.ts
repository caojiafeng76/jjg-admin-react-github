import { describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'

vi.mock('./supabase', () => ({
  default: {},
}))

import {
  buildDailyTrend,
  computeDeltaPercent,
  KPI_TREND_DAYS,
} from './apiDashboard'

const daysAgo = (n: number, hour = 10) =>
  dayjs().startOf('day').subtract(n, 'day').hour(hour).toISOString()

describe('buildDailyTrend', () => {
  it('aggregates dates into daily buckets ending today', () => {
    // 今天 2 条，昨天 1 条，前天 0 条，3 天前 1 条
    const dates = [daysAgo(0), daysAgo(0), daysAgo(1), daysAgo(3)]
    const trend = buildDailyTrend(dates, 5)
    expect(trend).toHaveLength(5)
    expect(trend[4]).toBe(2) // 今天
    expect(trend[3]).toBe(1) // 昨天
    expect(trend[2]).toBe(0) // 前天
    expect(trend[1]).toBe(1) // 3 天前
    expect(trend[0]).toBe(0) // 4 天前
  })

  it('ignores null, invalid, and out-of-range dates', () => {
    const dates = [
      null,
      'not-a-date',
      daysAgo(100), // 超出范围
      daysAgo(0, 23), // 今天 23 点仍算今天
    ]
    const trend = buildDailyTrend(dates, KPI_TREND_DAYS)
    expect(trend.reduce((sum, n) => sum + n, 0)).toBe(1)
    expect(trend[KPI_TREND_DAYS - 1]).toBe(1)
  })

  it('returns all-zero buckets for empty input', () => {
    const trend = buildDailyTrend([], 7)
    expect(trend).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
})

describe('computeDeltaPercent', () => {
  it('computes later-half vs earlier-half percentage', () => {
    // 前 7 天合计 10，后 7 天合计 15 → +50%
    const trend = [1, 2, 3, 4, 0, 0, 0, 1, 2, 3, 4, 5, 0, 0]
    expect(computeDeltaPercent(trend)).toBe(50)
  })

  it('returns negative percent on decline', () => {
    // 前 7 天合计 20，后 7 天合计 10 → -50%
    const trend = [10, 10, 0, 0, 0, 0, 0, 5, 5, 0, 0, 0, 0, 0]
    expect(computeDeltaPercent(trend)).toBe(-50)
  })

  it('returns null when earlier half is zero', () => {
    const trend = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1]
    expect(computeDeltaPercent(trend)).toBeNull()
  })

  it('returns null for odd length or too short', () => {
    expect(computeDeltaPercent([1, 2, 3])).toBeNull()
    expect(computeDeltaPercent([1])).toBeNull()
  })
})
