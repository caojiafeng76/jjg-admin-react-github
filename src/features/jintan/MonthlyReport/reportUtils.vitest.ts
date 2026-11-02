import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  formatJintanReportMonth,
  getDefaultJintanReportMonth,
  normalizeJintanReportMonth,
} from './reportUtils'

const now = dayjs('2026-11-02T10:00:00')

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
