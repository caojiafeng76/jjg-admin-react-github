import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

export type WorkshopMiscMaterialsReportStage = 'total' | 'raw' | 'semi' | 'finished'

export interface WorkshopMiscMaterialsAdjustment {
  id: string
  raw_material_before: number
  raw_material_after: number
  raw_material_diff: number
  semi_finished_before: number
  semi_finished_after: number
  semi_finished_diff: number
  finished_before: number
  finished_after: number
  finished_diff: number
  total_before: number
  total_after: number
  total_difference: number
  remarks: string
  operator_name: string
  created_at: string
}

/** 单个库存行的调整流水（由数据库触发器写入，前端只读） */
export async function getWorkshopMiscMaterialsAdjustmentList({
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
    .from('workshop_misc_materials_inventory_adjustments')
    .select(
      'id, raw_material_before, raw_material_after, raw_material_diff, semi_finished_before, semi_finished_after, semi_finished_diff, finished_before, finished_after, finished_diff, total_before, total_after, total_difference, remarks, operator_name, created_at',
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
    items: (data || []) as WorkshopMiscMaterialsAdjustment[],
    total: count || 0,
  }
}

export interface WorkshopMiscMaterialsMonthlyReportRow {
  inventory_id: string
  model: string
  customer_model: string
  specification: string
  category: string
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
 * 获取车间杂项材料月度库存报表
 * @param month 报表月份，格式 YYYY-MM
 * @param stage 统计维度：total（合计）/ raw（原材料）/ semi（半成品）/ finished（成品）
 */
export async function getWorkshopMiscMaterialsMonthlyReport(
  month: string,
  stage: WorkshopMiscMaterialsReportStage = 'total',
): Promise<WorkshopMiscMaterialsMonthlyReportRow[]> {
  const { data, error } = await supabase.rpc(
    'get_workshop_misc_materials_monthly_report',
    { p_month: `${month}-01`, p_stage: stage },
  )

  if (error) {
    throw handleApiError(error, '获取车间杂项材料月度报表失败')
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
