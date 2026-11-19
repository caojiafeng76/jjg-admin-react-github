import type {
  WorkshopMiscMaterialsMonthlyReportRow,
  WorkshopMiscMaterialsReportStage,
} from '@/services/apiWorkshopMiscMaterialsReport'
import {
  formatJintanReportMonth,
  normalizeJintanReportMonth,
} from '@/features/jintan/MonthlyReport/reportUtils'

export const WORKSHOP_MISC_REPORT_QUANTITY_KEYS = [
  'opening_quantity',
  'stock_in_quantity',
  'stock_out_quantity',
  'stock_adjust_quantity',
  'closing_quantity',
] as const satisfies ReadonlyArray<keyof WorkshopMiscMaterialsMonthlyReportRow>

export const WORKSHOP_MISC_REPORT_STAGE_LABELS: Record<
  WorkshopMiscMaterialsReportStage,
  string
> = {
  total: '合计',
  raw: '原材料',
  semi: '半成品',
  finished: '成品',
}

export const WORKSHOP_MISC_REPORT_STAGE_OPTIONS: Array<{
  value: WorkshopMiscMaterialsReportStage
  label: string
}> = [
  { value: 'total', label: '合计' },
  { value: 'raw', label: '原材料' },
  { value: 'semi', label: '半成品' },
  { value: 'finished', label: '成品' },
]

export function normalizeWorkshopMiscReportStage(
  value: string | null | undefined,
): WorkshopMiscMaterialsReportStage {
  if (value === 'raw' || value === 'semi' || value === 'finished') {
    return value
  }
  return 'total'
}

/** URL 月份校验与展示与金檀月报一致：默认上月，不晚于当月 */
export const normalizeWorkshopMiscReportMonth = normalizeJintanReportMonth
export const formatWorkshopMiscReportMonth = formatJintanReportMonth

/** 按 上月结余 / 本月入库 / 本月出库 / 本月调整 / 月末结存 顺序合计 */
export function sumWorkshopMiscReportRows(
  rows: WorkshopMiscMaterialsMonthlyReportRow[],
) {
  return WORKSHOP_MISC_REPORT_QUANTITY_KEYS.map(key =>
    rows.reduce((total, row) => total + row[key], 0),
  )
}
