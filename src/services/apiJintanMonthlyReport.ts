import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

export type JintanMonthlyReportCategory = 'parts' | 'profiles' | 'materials'

export const JINTAN_MONTHLY_REPORT_CATEGORIES: readonly JintanMonthlyReportCategory[]
  = ['parts', 'profiles', 'materials']

export const JINTAN_MONTHLY_REPORT_CATEGORY_LABELS: Record<
  JintanMonthlyReportCategory,
  string
> = {
  parts: '配件',
  profiles: '型材',
  materials: '素材',
}

export interface JintanMonthlyReportRow {
  category: JintanMonthlyReportCategory
  inventory_id: string
  /** 类型 A / B；配件没有类型，为空字符串 */
  item_type: string
  item_model: string
  item_name: string
  specification: string
  material: string
  supplier: string
  /** 上月结余 */
  opening_quantity: number
  /** 本月入库 */
  stock_in_quantity: number
  /** 本月出库 */
  stock_out_quantity: number
  /** 本月调整（直接改数的差额合计，可为负） */
  stock_adjust_quantity: number
  /** 月末结存 */
  closing_quantity: number
  /** 当前库存（倒推基准） */
  current_quantity: number
}

export type JintanMonthlyReport = Record<
  JintanMonthlyReportCategory,
  JintanMonthlyReportRow[]
>

function isReportCategory(
  value: string,
): value is JintanMonthlyReportCategory {
  return JINTAN_MONTHLY_REPORT_CATEGORIES.includes(
    value as JintanMonthlyReportCategory,
  )
}

/**
 * 获取金檀木业月度库存报表（配件 / 型材 / 素材）
 * @param month 报表月份，格式 YYYY-MM
 */
export async function getJintanMonthlyInventoryReport(
  month: string,
): Promise<JintanMonthlyReport> {
  const { data, error } = await supabase.rpc(
    'get_jintan_monthly_inventory_report',
    { p_month: `${month}-01` },
  )

  if (error) {
    throw handleApiError(error, '获取金檀月度报表失败')
  }

  const report: JintanMonthlyReport = { parts: [], profiles: [], materials: [] }
  for (const row of data ?? []) {
    const { category } = row
    if (!isReportCategory(category)) {
      continue
    }
    report[category].push({
      ...row,
      category,
      opening_quantity: Number(row.opening_quantity),
      stock_in_quantity: Number(row.stock_in_quantity),
      stock_out_quantity: Number(row.stock_out_quantity),
      stock_adjust_quantity: Number(row.stock_adjust_quantity),
      closing_quantity: Number(row.closing_quantity),
      current_quantity: Number(row.current_quantity),
    })
  }
  return report
}
