import type { SyneyMaterialsSearchFilters } from './syneyMaterialsSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import { applyJintanSearchFilters } from './jintanSearchFields'
import supabase from './supabase'
import { SYNEY_MATERIALS_SEARCH_FIELDS } from './syneyMaterialsSearchFields'

/** 入库 / 出库两张流水表结构一致，共用一套读写函数 */
export type SyneyMaterialsStockDirection = 'in' | 'out'

export interface SyneyMaterialsStockRecord {
  id: string
  inventory_id: string
  material_name: string
  specification: string
  unit: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface SyneyMaterialsStockFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

const TABLES = {
  in: 'syney_materials_stock_in',
  out: 'syney_materials_stock_out',
} as const

/**
 * 两张表列完全相同；收窄成单个表名，避免 supabase-js 对联合表名推导出联合类型
 */
function stockTable(direction: SyneyMaterialsStockDirection) {
  return TABLES[direction] as typeof TABLES.in
}

export const SYNEY_MATERIALS_STOCK_LABELS = {
  in: '入库',
  out: '出库',
} as const

export async function getSyneyMaterialsStockList(
  direction: SyneyMaterialsStockDirection,
  {
    page,
    pageSize,
    filters,
    inventoryId,
    signal,
  }: {
    page: number
    pageSize: number
    filters?: SyneyMaterialsSearchFilters
    inventoryId?: string
    signal?: AbortSignal
  },
): Promise<{ items: SyneyMaterialsStockRecord[], total: number }> {
  let query = supabase
    .from(stockTable(direction))
    .select('*', { count: 'exact' })
  query = applyJintanSearchFilters(query, filters, SYNEY_MATERIALS_SEARCH_FIELDS)
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
      `获取材料${SYNEY_MATERIALS_STOCK_LABELS[direction]}列表失败`,
    )
  }
  return {
    items: (data ?? []) as SyneyMaterialsStockRecord[],
    total: count ?? 0,
  }
}

export async function createSyneyMaterialsStock(
  direction: SyneyMaterialsStockDirection,
  values: SyneyMaterialsStockFormValues,
): Promise<void> {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error(`${label}数量必须为正整数`)
  }
  if (!values.inventory_id)
    throw new Error('请选择材料')

  const { error } = await supabase.from(stockTable(direction)).insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error)
    throw handleApiError(error, `新增材料${label}失败`)
}

export async function updateSyneyMaterialsStockRemarks(
  direction: SyneyMaterialsStockDirection,
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
      `修改材料${SYNEY_MATERIALS_STOCK_LABELS[direction]}备注失败`,
    )
  }
}

export async function deleteSyneyMaterialsStock(
  direction: SyneyMaterialsStockDirection,
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
      `删除材料${SYNEY_MATERIALS_STOCK_LABELS[direction]}记录失败`,
    )
  }
}
