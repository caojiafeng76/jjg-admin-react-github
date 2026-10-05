import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanProfilesStockOut {
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

export interface JintanProfilesStockOutFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

function keywordFilter(keyword: string): string {
  return `profile_model.ilike.%${keyword}%,profile_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%`
}

export async function getJintanProfilesStockOutList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}): Promise<{ items: JintanProfilesStockOut[]; total: number }> {
  let query = supabase
    .from('jintan_profiles_stock_out')
    .select('*', { count: 'exact' })
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) throw handleApiError(error, '获取型材出库列表失败')
  return { items: data ?? [], total: count ?? 0 }
}

export async function createJintanProfilesStockOut(
  values: JintanProfilesStockOutFormValues,
): Promise<void> {
  if (!Number.isSafeInteger(values.quantity) || values.quantity <= 0) {
    throw new Error('出库数量必须为正整数')
  }
  if (!values.inventory_id) throw new Error('请选择型材')

  const { error } = await supabase.from('jintan_profiles_stock_out').insert({
    inventory_id: values.inventory_id,
    quantity: values.quantity,
    remarks: (values.remarks ?? '').trim(),
  })
  if (error) throw handleApiError(error, '新增型材出库失败')
}

export async function updateJintanProfilesStockOutRemarks({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<void> {
  const { error } = await supabase
    .from('jintan_profiles_stock_out')
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '修改型材出库备注失败')
}

export async function deleteJintanProfilesStockOut(id: string): Promise<void> {
  const { error } = await supabase
    .from('jintan_profiles_stock_out')
    .delete()
    .eq('id', id)
    .select('id')
    .single()
  if (error) throw handleApiError(error, '删除型材出库记录失败')
}
