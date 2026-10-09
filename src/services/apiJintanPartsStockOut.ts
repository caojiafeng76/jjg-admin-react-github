import publicSupabase from './publicSupabase'
import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanPartsStockOut {
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

export interface JintanPartsStockOutFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

function keywordFilter(keyword: string): string {
  return `part_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%,supplier.ilike.%${keyword}%`
}

export async function getJintanPartsStockOutList({
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
}): Promise<{ items: JintanPartsStockOut[]; total: number }> {
  let query = supabase
    .from('jintan_parts_stock_out')
    .select('*', { count: 'exact' })
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))
  if (inventoryId) query = query.eq('inventory_id', inventoryId)
  if (signal) query = query.abortSignal(signal)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw handleApiError(error, '获取配件出库列表失败')
  return { items: data ?? [], total: count ?? 0 }
}

export async function createJintanPartsStockOut(
  values: JintanPartsStockOutFormValues,
): Promise<void> {
  await insertJintanPartsStockOut(supabase, values, '新增配件出库失败')
}

export async function createPublicJintanPartsStockOut(
  values: JintanPartsStockOutFormValues,
): Promise<void> {
  await insertJintanPartsStockOut(publicSupabase, values, '创建配件出库失败')
}

async function insertJintanPartsStockOut(
  client: typeof supabase,
  values: JintanPartsStockOutFormValues,
  errorMessage: string,
): Promise<void> {
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error('出库数量必须为正整数')
  }
  if (!values.inventory_id) throw new Error('请选择配件')

  const { error } = await client.from('jintan_parts_stock_out').insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error) throw handleApiError(error, errorMessage)
}

export async function updateJintanPartsStockOutRemarks({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<void> {
  const { error } = await supabase
    .from('jintan_parts_stock_out')
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '修改配件出库备注失败')
}

export async function deleteJintanPartsStockOut(id: string): Promise<void> {
  const { error } = await supabase
    .from('jintan_parts_stock_out')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '删除配件出库记录失败')
}
