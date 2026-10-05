import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanProfilesStockIn {
  id: string
  inventory_id: string
  profile_model: string
  profile_name: string
  specification: string
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

function keywordFilter(keyword: string): string {
  return `profile_model.ilike.%${keyword}%,profile_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%`
}

export async function getJintanProfilesStockInList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}): Promise<{ items: JintanProfilesStockIn[]; total: number }> {
  let query = supabase
    .from('jintan_profiles_stock_in')
    .select('*', { count: 'exact' })
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw handleApiError(error, '获取型材入库列表失败')
  return { items: data ?? [], total: count ?? 0 }
}

export async function createJintanProfilesStockIn(
  values: JintanProfilesStockInFormValues,
): Promise<void> {
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error('入库数量必须为正整数')
  }
  if (!values.inventory_id) throw new Error('请选择型材')

  const { error } = await supabase.from('jintan_profiles_stock_in').insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error) throw handleApiError(error, '新增型材入库失败')
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
  if (error) throw handleApiError(error, '修改型材入库备注失败')
}

export async function deleteJintanProfilesStockIn(id: string): Promise<void> {
  const { error } = await supabase
    .from('jintan_profiles_stock_in')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '删除型材入库记录失败')
}
