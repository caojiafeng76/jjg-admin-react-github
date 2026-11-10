import type { SyneyMaterialsMonthlyReportRow } from '@/services/apiSyneyMaterialsReport'
import {
  formatJintanReportMonth,
  normalizeJintanReportMonth,
} from '@/features/jintan/MonthlyReport/reportUtils'

export const SYNEY_MATERIALS_REPORT_QUANTITY_KEYS = [
  'opening_quantity',
  'stock_in_quantity',
  'stock_out_quantity',
  'stock_adjust_quantity',
  'closing_quantity',
] as const satisfies ReadonlyArray<keyof SyneyMaterialsMonthlyReportRow>

/** URL 月份校验与展示与金檀月报一致：默认上月，不晚于当月 */
export const normalizeSyneyMaterialsReportMonth = normalizeJintanReportMonth
export const formatSyneyMaterialsReportMonth = formatJintanReportMonth

/** 按 上月结余 / 本月入库 / 本月出库 / 本月调整 / 月末结存 顺序合计 */
export function sumSyneyMaterialsReportRows(rows: SyneyMaterialsMonthlyReportRow[]) {
  return SYNEY_MATERIALS_REPORT_QUANTITY_KEYS.map(key =>
    rows.reduce((total, row) => total + row[key], 0),
  )
}
