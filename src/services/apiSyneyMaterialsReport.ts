import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

export interface SyneyMaterialsAdjustment {
  id: string
  quantity_before: number
  quantity_after: number
  difference: number
  remarks: string
  operator_name: string
  created_at: string
}

/** 单个库存行的调整流水（由数据库触发器写入，前端只读） */
export async function getSyneyMaterialsAdjustmentList({
  inventoryId,
  page,
  pageSize,
  signal,
}: {
  inventoryId: string
  page: number
  pageSize: number
  signal?: AbortSignal
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('syney_materials_inventory_adjustments')
    .select(
      'id, quantity_before, quantity_after, difference, remarks, operator_name, created_at',
      { count: 'exact' },
    )
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '获取库存调整记录失败')
  }

  return {
    items: (data || []) as SyneyMaterialsAdjustment[],
    total: count || 0,
  }
}

export interface SyneyMaterialsMonthlyReportRow {
  inventory_id: string
  material_name: string
  specification: string
  unit: string
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

/**
 * 获取西尼材料月度库存报表
 * @param month 报表月份，格式 YYYY-MM
 */
export async function getSyneyMaterialsMonthlyReport(
  month: string,
): Promise<SyneyMaterialsMonthlyReportRow[]> {
  const { data, error } = await supabase.rpc(
    'get_syney_materials_monthly_report',
    { p_month: `${month}-01` },
  )

  if (error) {
    throw handleApiError(error, '获取西尼材料月度报表失败')
  }

  return (data ?? []).map(row => ({
    ...row,
    opening_quantity: Number(row.opening_quantity),
    stock_in_quantity: Number(row.stock_in_quantity),
    stock_out_quantity: Number(row.stock_out_quantity),
    stock_adjust_quantity: Number(row.stock_adjust_quantity),
    closing_quantity: Number(row.closing_quantity),
    current_quantity: Number(row.current_quantity),
  }))
}
