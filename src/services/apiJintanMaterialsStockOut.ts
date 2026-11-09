import type { JintanItemType } from './jintanItemType'
import type { JintanSearchFilters } from './jintanSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import { applyJintanSearchFilters, JINTAN_MATERIALS_SEARCH_FIELDS } from './jintanSearchFields'
import supabase from './supabase'

export interface JintanMaterialsStockOut {
  id: string
  inventory_id: string
  item_type: JintanItemType
  material_model: string
  material_name: string
  specification: string
  material: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanMaterialsStockOutFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

export async function getJintanMaterialsStockOutList({
  page,
  pageSize,
  filters,
  itemType,
  inventoryId,
  signal,
}: {
  page: number
  pageSize: number
  filters?: JintanSearchFilters
  itemType?: JintanItemType
  inventoryId?: string
  signal?: AbortSignal
}): Promise<{ items: JintanMaterialsStockOut[], total: number }> {
  let query = supabase
    .from('jintan_materials_stock_out')
    .select('*', { count: 'exact' })
  query = applyJintanSearchFilters(query, filters, JINTAN_MATERIALS_SEARCH_FIELDS)
  if (itemType)
    query = query.eq('item_type', itemType)
  if (inventoryId)
    query = query.eq('inventory_id', inventoryId)
  if (signal)
    query = query.abortSignal(signal)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error)
    throw handleApiError(error, '获取素材出库列表失败')
  return { items: (data ?? []) as JintanMaterialsStockOut[], total: count ?? 0 }
}

export async function createJintanMaterialsStockOut(
  values: JintanMaterialsStockOutFormValues,
): Promise<void> {
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error('出库数量必须为正整数')
  }
  if (!values.inventory_id)
    throw new Error('请选择素材')

  const { error } = await supabase.from('jintan_materials_stock_out').insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error)
    throw handleApiError(error, '新增素材出库失败')
}

export async function updateJintanMaterialsStockOutRemarks({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<void> {
  const { error } = await supabase
    .from('jintan_materials_stock_out')
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select('id')
    .single()
  if (error)
    throw handleApiError(error, '修改素材出库备注失败')
}

export async function deleteJintanMaterialsStockOut(id: string): Promise<void> {
  const { error } = await supabase
    .from('jintan_materials_stock_out')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error)
    throw handleApiError(error, '删除素材出库记录失败')
}
