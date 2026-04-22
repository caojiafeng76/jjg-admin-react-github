import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface YoumaiRawMaterialStockOut {
  id: string
  inventory_id: string
  model: string
  specification: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface YoumaiRawMaterialStockOutFormValues {
  inventory_id: string
  quantity: number
  remarks: string
}

type DynamicSupabaseTable = { from: (table: string) => any }

function stockOutTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_raw_material_stock_out',
  )
}

function inventoryTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_raw_material_inventory',
  )
}

async function getInventorySnapshot(inventoryId: string) {
  const { data, error } = await inventoryTable()
    .select('id, model, specification, quantity')
    .eq('id', inventoryId)
    .single()

  if (error || !data)
    throw handleApiError(error ?? new Error('库存行不存在'), '原料库存项不存在')
  return data as {
    id: string
    model: string
    specification: string
    quantity: number
  }
}

export async function getYoumaiRawMaterialStockOutList({
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
  let query = stockOutTable()
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
  if (error) throw handleApiError(error, '原料出库列表获取失败')
  return {
    rawMaterialStockOut: (data ?? []) as YoumaiRawMaterialStockOut[],
    count: count ?? 0,
  }
}

export async function createYoumaiRawMaterialStockOut(
  values: YoumaiRawMaterialStockOutFormValues,
): Promise<YoumaiRawMaterialStockOut> {
  const snapshot = await getInventorySnapshot(values.inventory_id)

  if (snapshot.quantity < values.quantity) {
    throw new Error(
      `库存不足：当前库存 ${snapshot.quantity}，出库数量 ${values.quantity}`,
    )
  }

  const { data, error } = await stockOutTable()
    .insert({
      inventory_id: values.inventory_id,
      model: snapshot.model,
      specification: snapshot.specification,
      quantity: values.quantity,
      remarks: (values.remarks ?? '').trim(),
    })
    .select()
    .single()

  if (error) throw handleApiError(error, '原料出库新建失败')
  return data as YoumaiRawMaterialStockOut
}

export async function deleteYoumaiRawMaterialStockOut(
  id: string,
): Promise<void> {
  const { error } = await stockOutTable().delete().eq('id', id)
  if (error) throw handleApiError(error, '原料出库记录删除失败')
}

export async function updateYoumaiRawMaterialStockOut({
  id,
  remarks,
}: {
  id: string
  remarks: string
}): Promise<YoumaiRawMaterialStockOut> {
  const { data, error } = await stockOutTable()
    .update({ remarks: remarks.trim() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw handleApiError(error, '原料出库记录更新失败')
  return data as YoumaiRawMaterialStockOut
}
