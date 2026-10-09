import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanMaterialsStockIn {
  id: string
  inventory_id: string
  material_model: string
  material_name: string
  specification: string
  material: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanMaterialsStockInFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

function keywordFilter(keyword: string): string {
  return `material_model.ilike.%${keyword}%,material_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%`
}

export async function getJintanMaterialsStockInList({
  page,
  pageSize,
  keyword,
  inventoryId,
  signal,
}: {
  page: number
  pageSize: number
  keyword?: string
  inventoryId?: string
  signal?: AbortSignal
}): Promise<{ items: JintanMaterialsStockIn[]; total: number }> {
  let query = supabase
    .from('jintan_materials_stock_in')
    .select('*', { count: 'exact' })
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))
  if (inventoryId) query = query.eq('inventory_id', inventoryId)
  if (signal) query = query.abortSignal(signal)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw handleApiError(error, '获取素材入库列表失败')
  return { items: data ?? [], total: count ?? 0 }
}

export async function createJintanMaterialsStockIn(
  values: JintanMaterialsStockInFormValues,
): Promise<void> {
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error('入库数量必须为正整数')
  }
  if (!values.inventory_id) throw new Error('请选择素材')

  const { error } = await supabase.from('jintan_materials_stock_in').insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error) throw handleApiError(error, '新增素材入库失败')
}

export async function updateJintanMaterialsStockInRemarks({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<void> {
  const { error } = await supabase
    .from('jintan_materials_stock_in')
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '修改素材入库备注失败')
}

export async function deleteJintanMaterialsStockIn(id: string): Promise<void> {
  const { error } = await supabase
    .from('jintan_materials_stock_in')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '删除素材入库记录失败')
}
