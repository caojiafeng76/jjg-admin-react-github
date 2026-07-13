import supabase from './supabase'
import {
  buildYoumaiRawMaterialOptionsQuery,
  YOUMAI_RAW_MATERIAL_OPTION_SELECT,
} from './youmaiOptions'
import { handleApiError } from '@/utils/errorHandler'

export interface YoumaiRawMaterialInventory {
  id: string
  model: string
  specification: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface YoumaiRawMaterialInventoryFormValues {
  model: string
  specification: string
  quantity: number
}

export interface YoumaiRawMaterialInventoryOption {
  id: string
  model: string
  specification: string
  quantity: number
}

type DynamicSupabaseTable = { from: (table: string) => any }

function inventoryTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_raw_material_inventory',
  )
}

export async function getYoumaiRawMaterialInventoryList({
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
  let query = inventoryTable()
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (keyword) {
    query = query.or(
      `model.ilike.%${keyword}%,specification.ilike.%${keyword}%`,
    )
  }

  if (signal) query = query.abortSignal(signal)

  const { data, error, count } = await query
  if (error) throw handleApiError(error, '原料库存列表获取失败')
  return {
    rawMaterialInventory: (data ?? []) as YoumaiRawMaterialInventory[],
    count: count ?? 0,
  }
}

export async function getYoumaiRawMaterialInventoryOptions(
  keyword?: string,
  signal?: AbortSignal,
  limit?: number,
): Promise<YoumaiRawMaterialInventoryOption[]> {
  const query = buildYoumaiRawMaterialOptionsQuery(
    inventoryTable().select(YOUMAI_RAW_MATERIAL_OPTION_SELECT),
    { keyword, signal, limit },
  )

  const { data, error } = await query

  if (error) throw handleApiError(error, '原料库存选项获取失败')
  return (data ?? []) as YoumaiRawMaterialInventoryOption[]
}

export async function getYoumaiRawMaterialInventoryOptionById(
  id: string,
  signal?: AbortSignal,
): Promise<YoumaiRawMaterialInventoryOption | null> {
  let query = inventoryTable()
    .select(YOUMAI_RAW_MATERIAL_OPTION_SELECT)
    .eq('id', id)

  if (signal) query = query.abortSignal(signal)

  const { data, error } = await query.maybeSingle()

  if (error) throw handleApiError(error, '原料库存项获取失败')
  return data as YoumaiRawMaterialInventoryOption | null
}

export async function createYoumaiRawMaterialInventory(
  values: YoumaiRawMaterialInventoryFormValues,
): Promise<YoumaiRawMaterialInventory> {
  const { data, error } = await inventoryTable()
    .insert({
      model: values.model.trim(),
      specification: values.specification.trim(),
      quantity: values.quantity,
    })
    .select()
    .single()

  if (error) throw handleApiError(error, '原料库存新建失败')
  return data as YoumaiRawMaterialInventory
}

export async function updateYoumaiRawMaterialInventory({
  id,
  values,
}: {
  id: string
  values: Partial<YoumaiRawMaterialInventoryFormValues>
}): Promise<YoumaiRawMaterialInventory> {
  const payload: Record<string, unknown> = {}
  if (values.model !== undefined) payload.model = values.model.trim()
  if (values.specification !== undefined)
    payload.specification = values.specification.trim()
  if (values.quantity !== undefined) payload.quantity = values.quantity

  const { data, error } = await inventoryTable()
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw handleApiError(error, '原料库存更新失败')
  return data as YoumaiRawMaterialInventory
}

export async function deleteYoumaiRawMaterialInventory(
  id: string,
): Promise<void> {
  const { error } = await inventoryTable().delete().eq('id', id)
  if (error) throw handleApiError(error, '原料库存删除失败')
}

export async function getYoumaiRawMaterialInventoryForExport(
  keyword?: string,
): Promise<YoumaiRawMaterialInventory[]> {
  let query = inventoryTable()
    .select('*')
    .order('model', { ascending: true })
    .order('specification', { ascending: true })

  if (keyword) {
    query = query.or(
      `model.ilike.%${keyword}%,specification.ilike.%${keyword}%`,
    )
  }

  const { data, error } = await query
  if (error) throw handleApiError(error, '原料库存导出数据获取失败')
  return (data ?? []) as YoumaiRawMaterialInventory[]
}
