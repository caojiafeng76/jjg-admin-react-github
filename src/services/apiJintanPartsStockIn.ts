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

export interface JintanPartsStockInOption {
  id: string
  part_name: string
  specification: string
  material: string
  supplier: string
  quantity: number
}

function keywordFilter(keyword: string): string {
  return `part_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%,supplier.ilike.%${keyword}%`
}

export async function getJintanPartsStockInList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}): Promise<{ items: JintanPartsStockIn[]; total: number }> {
  let query = supabase
    .from('jintan_parts_stock_in')
    .select('*', { count: 'exact' })
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw handleApiError(error, '获取配件入库列表失败')
  return { items: data ?? [], total: count ?? 0 }
}

export async function getJintanPartsStockInOptions(
  keyword?: string,
): Promise<JintanPartsStockInOption[]> {
  let query = supabase
    .from('jintan_parts_inventory')
    .select('id, part_name, specification, material, supplier, quantity')
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))

  const { data, error } = await query
    .order('part_name', { ascending: true })
    .limit(50)

  if (error) throw handleApiError(error, '获取可入库配件失败')
  return data ?? []
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
