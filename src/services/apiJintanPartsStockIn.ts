import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanPartsStockIn {
  id: string
  inventory_id: string
  part_name: string
  specification: string
  material: string
  supplier: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanPartsStockInFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

function keywordFilter(keyword: string): string {
  return `part_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%,supplier.ilike.%${keyword}%`
}

export async function getJintanPartsStockInList({
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
}): Promise<{ items: JintanPartsStockIn[]; total: number }> {
  let query = supabase
    .from('jintan_parts_stock_in')
    .select('*', { count: 'exact' })
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))
  if (inventoryId) query = query.eq('inventory_id', inventoryId)
  if (signal) query = query.abortSignal(signal)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw handleApiError(error, '获取配件入库列表失败')
  return { items: data ?? [], total: count ?? 0 }
}

export async function createJintanPartsStockIn(
  values: JintanPartsStockInFormValues,
): Promise<void> {
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error('入库数量必须为正整数')
  }
  if (!values.inventory_id) throw new Error('请选择配件')

  const { error } = await supabase.from('jintan_parts_stock_in').insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error) throw handleApiError(error, '新增配件入库失败')
}

export async function updateJintanPartsStockInRemarks({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<void> {
  const { error } = await supabase
    .from('jintan_parts_stock_in')
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '修改配件入库备注失败')
}

export async function deleteJintanPartsStockIn(id: string): Promise<void> {
  const { error } = await supabase
    .from('jintan_parts_stock_in')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '删除配件入库记录失败')
}
