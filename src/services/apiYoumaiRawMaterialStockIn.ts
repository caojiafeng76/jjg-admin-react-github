import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface YoumaiRawMaterialStockIn {
  id: string
  inventory_id: string
  model: string
  specification: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface YoumaiRawMaterialStockInFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

type DynamicSupabaseTable = { from: (table: string) => any }

function stockInTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_raw_material_stock_in',
  )
}

function inventoryTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_raw_material_inventory',
  )
}

async function getInventorySnapshot(inventoryId: string) {
  const { data, error } = await inventoryTable()
    .select('id, model, specification')
    .eq('id', inventoryId)
    .single()

  if (error || !data)
    throw handleApiError(error ?? new Error('库存行不存在'), '原料库存项不存在')
  return data as { id: string; model: string; specification: string }
}

export async function getYoumaiRawMaterialStockInList({
  page,
  pageSize,
  keyword,
  signal,
}: {
  page: number
  pageSize: number
  keyword?: string
  signal?: AbortSignal
}) {
  let query = stockInTable()
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (keyword) {
    query = query.or(
      `model.ilike.%${keyword}%,specification.ilike.%${keyword}%`,
    )
  }

  if (signal) query = query.abortSignal(signal)

  const { data, error, count } = await query
  if (error) throw handleApiError(error, '原料入库列表获取失败')
  return {
    rawMaterialStockIn: (data ?? []) as YoumaiRawMaterialStockIn[],
    count: count ?? 0,
  }
}

export async function createYoumaiRawMaterialStockIn(
  values: YoumaiRawMaterialStockInFormValues,
): Promise<YoumaiRawMaterialStockIn> {
  const snapshot = await getInventorySnapshot(values.inventory_id)

  const { data, error } = await stockInTable()
    .insert({
      inventory_id: values.inventory_id,
      model: snapshot.model,
      specification: snapshot.specification,
      quantity: values.quantity,
      remarks: (values.remarks ?? '').trim(),
    })
    .select()
    .single()

  if (error) throw handleApiError(error, '原料入库新建失败')
  return data as YoumaiRawMaterialStockIn
}

export async function deleteYoumaiRawMaterialStockIn(
  id: string,
): Promise<void> {
  const { error } = await stockInTable().delete().eq('id', id)
  if (error) throw handleApiError(error, '原料入库记录删除失败')
}

export async function updateYoumaiRawMaterialStockIn({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<YoumaiRawMaterialStockIn> {
  const { data, error } = await stockInTable()
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw handleApiError(error, '原料入库记录更新失败')
  return data as YoumaiRawMaterialStockIn
}
