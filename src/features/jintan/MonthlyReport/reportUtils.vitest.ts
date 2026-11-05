import type { JintanMonthlyReport, JintanMonthlyReportRow } from '@/services/apiJintanMonthlyReport'
import dayjs from 'dayjs'

import { describe, expect, it } from 'vitest'
import {
  filterJintanMonthlyReportByItemType,
  formatJintanReportMonth,
  getDefaultJintanReportMonth,
  normalizeJintanReportMonth,
} from './reportUtils'

const now = dayjs('2026-11-02T10:00:00')

function reportRow(
  overrides: Pick<JintanMonthlyReportRow, 'category' | 'inventory_id' | 'item_type'>,
): JintanMonthlyReportRow {
  return {
    item_model: '',
    item_name: '立柱',
    specification: '',
    material: '',
    supplier: '',
    opening_quantity: 0,
    stock_in_quantity: 0,
    stock_out_quantity: 0,
    stock_adjust_quantity: 0,
    closing_quantity: 0,
    current_quantity: 0,
    ...overrides,
  }
}

describe('filterJintanMonthlyReportByItemType', () => {
  const report: JintanMonthlyReport = {
    parts: [reportRow({ category: 'parts', inventory_id: 'p', item_type: '' })],
    profiles: [
      reportRow({ category: 'profiles', inventory_id: 'pa', item_type: 'A' }),
      reportRow({ category: 'profiles', inventory_id: 'pb', item_type: 'B' }),
    ],
    materials: [
      reportRow({ category: 'materials', inventory_id: 'ma', item_type: 'A' }),
    ],
  }

  it('returns the report unchanged without a type', () => {
    expect(filterJintanMonthlyReportByItemType(report)).toBe(report)
  })

  it('filters profiles and materials but keeps parts', () => {
    const filtered = filterJintanMonthlyReportByItemType(report, 'B')

    expect(filtered.parts.map(row => row.inventory_id)).toEqual(['p'])
    expect(filtered.profiles.map(row => row.inventory_id)).toEqual(['pb'])
    expect(filtered.materials).toEqual([])
  })
})

describe('jintan monthly report month helpers', () => {
  it('defaults to the previous month, across year boundaries', () => {
    expect(getDefaultJintanReportMonth(now)).toBe('2026-10')
    expect(getDefaultJintanReportMonth(dayjs('2027-01-05'))).toBe('2026-12')
  })

  it('keeps valid past and current months', () => {
    expect(normalizeJintanReportMonth('2026-03', now)).toBe('2026-03')
    expect(normalizeJintanReportMonth('2026-11', now)).toBe('2026-11')
  })

  it('falls back to the default month for invalid or future values', () => {
    expect(normalizeJintanReportMonth(null, now)).toBe('2026-10')
    expect(normalizeJintanReportMonth('2026-13', now)).toBe('2026-10')
    expect(normalizeJintanReportMonth('abc', now)).toBe('2026-10')
    expect(normalizeJintanReportMonth('2026-12', now)).toBe('2026-10')
  })

  it('formats the month label in Chinese', () => {
    expect(formatJintanReportMonth('2026-03')).toBe('2026年3月')
  })
})
