import type { JintanItemType } from './jintanItemType'
import type { JintanSearchFilters } from './jintanSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import { applyJintanSearchFilters, JINTAN_PROFILES_SEARCH_FIELDS } from './jintanSearchFields'
import supabase from './supabase'

export interface JintanProfilesStockIn {
  id: string
  inventory_id: string
  item_type: JintanItemType
  profile_model: string
  profile_name: string
  specification: string
  color: string
  material: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanProfilesStockInFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

export async function getJintanProfilesStockInList({
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
}): Promise<{ items: JintanProfilesStockIn[], total: number }> {
  let query = supabase
    .from('jintan_profiles_stock_in')
    .select('*', { count: 'exact' })
  query = applyJintanSearchFilters(query, filters, JINTAN_PROFILES_SEARCH_FIELDS)
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
    throw handleApiError(error, '获取型材入库列表失败')
  return { items: (data ?? []) as JintanProfilesStockIn[], total: count ?? 0 }
}

export async function createJintanProfilesStockIn(
  values: JintanProfilesStockInFormValues,
): Promise<void> {
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error('入库数量必须为正整数')
  }
  if (!values.inventory_id)
    throw new Error('请选择型材')

  const { error } = await supabase.from('jintan_profiles_stock_in').insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error)
    throw handleApiError(error, '新增型材入库失败')
}

export async function updateJintanProfilesStockInRemarks({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<void> {
  const { error } = await supabase
    .from('jintan_profiles_stock_in')
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select('id')
    .single()
  if (error)
    throw handleApiError(error, '修改型材入库备注失败')
}

export async function deleteJintanProfilesStockIn(id: string): Promise<void> {
  const { error } = await supabase
    .from('jintan_profiles_stock_in')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error)
    throw handleApiError(error, '删除型材入库记录失败')
}
