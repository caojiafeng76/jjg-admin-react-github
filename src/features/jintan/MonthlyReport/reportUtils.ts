import type {
  JintanMonthlyReport,
  JintanMonthlyReportRow,
} from '@/services/apiJintanMonthlyReport'
import type { JintanItemType } from '@/services/jintanItemType'
import dayjs from 'dayjs'

export const JINTAN_MONTHLY_REPORT_QUANTITY_KEYS = [
  'opening_quantity',
  'stock_in_quantity',
  'stock_out_quantity',
  'stock_adjust_quantity',
  'closing_quantity',
] as const satisfies ReadonlyArray<keyof JintanMonthlyReportRow>

const MONTH_PATTERN = /^\d{4}-(?:0[1-9]|1[0-2])$/

/** 默认报表月份：上月（YYYY-MM） */
export function getDefaultJintanReportMonth(now = dayjs()) {
  return now.subtract(1, 'month').format('YYYY-MM')
}

/** 校验 URL 中的月份：格式合法且不晚于当月，否则回退到默认月份 */
export function normalizeJintanReportMonth(
  value: string | null | undefined,
  now = dayjs(),
) {
  if (!value || !MONTH_PATTERN.test(value)) {
    return getDefaultJintanReportMonth(now)
  }
  return value > now.format('YYYY-MM') ? getDefaultJintanReportMonth(now) : value
}

/** 月份 YYYY-MM → 2026年10月 */
export function formatJintanReportMonth(month: string) {
  return dayjs(`${month}-01`).format('YYYY年M月')
}

/** 按类型筛选配件、型材、素材 */
export function filterJintanMonthlyReportByItemType(
  report: JintanMonthlyReport,
  itemType?: JintanItemType,
): JintanMonthlyReport {
  if (!itemType) {
    return report
  }
  return {
    parts: report.parts.filter(row => row.item_type === itemType),
    profiles: report.profiles.filter(row => row.item_type === itemType),
    materials: report.materials.filter(row => row.item_type === itemType),
  }
}

/** 按 上月结余 / 本月入库 / 本月出库 / 本月调整 / 月末结存 顺序合计 */
export function sumJintanMonthlyReportRows(rows: JintanMonthlyReportRow[]) {
  return JINTAN_MONTHLY_REPORT_QUANTITY_KEYS.map(key =>
    rows.reduce((total, row) => total + row[key], 0),
  )
}
