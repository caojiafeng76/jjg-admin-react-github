import type { WorkshopMiscMaterialsSearchFilters } from './workshopMiscMaterialsSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'
import {
  applyWorkshopMiscMaterialsKeyword,
  applyWorkshopMiscMaterialsSearchFilters,
} from './workshopMiscMaterialsSearchFields'

/** 入库 / 出库两张流水表结构一致，共用一套读写函数 */
export type WorkshopMiscMaterialsStockDirection = 'in' | 'out'

export interface WorkshopMiscMaterialsStockRecord {
  id: string
  inventory_id: string
  model: string
  customer_model: string
  specification: string
  category: string
  raw_material_quantity: number
  semi_finished_quantity: number
  finished_quantity: number
  total_quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface WorkshopMiscMaterialsStockFormValues {
  inventory_id: string
  raw_material_quantity: number
  semi_finished_quantity: number
  finished_quantity: number
  remarks: string
}

const TABLES = {
  in: 'workshop_misc_materials_stock_in',
  out: 'workshop_misc_materials_stock_out',
} as const

/**
 * 两张表列完全相同；收窄成单个表名，避免 supabase-js 对联合表名推导出联合类型
 */
function stockTable(direction: WorkshopMiscMaterialsStockDirection) {
  return TABLES[direction] as typeof TABLES.in
}

export const WORKSHOP_MISC_MATERIALS_STOCK_LABELS = {
  in: '入库',
  out: '出库',
} as const

function assertNonNegativeInteger(value: number, fieldLabel: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldLabel}必须为非负整数`)
  }
}

export async function getWorkshopMiscMaterialsStockList(
  direction: WorkshopMiscMaterialsStockDirection,
  {
    page,
    pageSize,
    filters,
    keyword,
    inventoryId,
    signal,
  }: {
    page: number
    pageSize: number
    filters?: WorkshopMiscMaterialsSearchFilters
    keyword?: string
    inventoryId?: string
    signal?: AbortSignal
  },
): Promise<{ items: WorkshopMiscMaterialsStockRecord[], total: number }> {
  let query = supabase
    .from(stockTable(direction))
    .select('*', { count: 'exact' })
  query = applyWorkshopMiscMaterialsSearchFilters(query, filters)
  query = applyWorkshopMiscMaterialsKeyword(query, keyword)
  if (inventoryId)
    query = query.eq('inventory_id', inventoryId)
  if (signal)
    query = query.abortSignal(signal)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) {
    throw handleApiError(
      error,
      `获取材料${WORKSHOP_MISC_MATERIALS_STOCK_LABELS[direction]}列表失败`,
    )
  }
  return {
    items: (data ?? []) as WorkshopMiscMaterialsStockRecord[],
    total: count ?? 0,
  }
}

export async function createWorkshopMiscMaterialsStock(
  direction: WorkshopMiscMaterialsStockDirection,
  values: WorkshopMiscMaterialsStockFormValues,
): Promise<void> {
  const label = WORKSHOP_MISC_MATERIALS_STOCK_LABELS[direction]
  if (!values.inventory_id)
    throw new Error('请选择材料')

  const raw = values.raw_material_quantity ?? 0
  const semi = values.semi_finished_quantity ?? 0
  const finished = values.finished_quantity ?? 0

  assertNonNegativeInteger(raw, `原材料${label}数量`)
  assertNonNegativeInteger(semi, `半成品${label}数量`)
  assertNonNegativeInteger(finished, `成品${label}数量`)

  if (raw + semi + finished <= 0) {
    throw new Error(`请至少填写一项大于 0 的${label}数量`)
  }

  const { error } = await supabase.from(stockTable(direction)).insert({
    inventory_id: values.inventory_id,
    raw_material_quantity: raw,
    semi_finished_quantity: semi,
    finished_quantity: finished,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error)
    throw handleApiError(error, `新增材料${label}失败`)
}

export async function updateWorkshopMiscMaterialsStockRemarks(
  direction: WorkshopMiscMaterialsStockDirection,
  { id, remarks }: { id: string, remarks: string },
): Promise<void> {
  const { error } = await supabase
    .from(stockTable(direction))
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select('id')
    .single()
  if (error) {
    throw handleApiError(
      error,
      `修改材料${WORKSHOP_MISC_MATERIALS_STOCK_LABELS[direction]}备注失败`,
    )
  }
}

export async function deleteWorkshopMiscMaterialsStock(
  direction: WorkshopMiscMaterialsStockDirection,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from(stockTable(direction))
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) {
    throw handleApiError(
      error,
      `删除材料${WORKSHOP_MISC_MATERIALS_STOCK_LABELS[direction]}记录失败`,
    )
  }
}
