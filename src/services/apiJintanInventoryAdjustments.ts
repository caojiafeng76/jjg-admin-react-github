import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

export interface JintanInventoryAdjustment {
  id: string
  quantity_before: number
  quantity_after: number
  difference: number
  remarks: string
  operator_name: string
  created_at: string
}

/** 单个库存行的调整流水（由数据库触发器写入，前端只读） */
export async function getJintanInventoryAdjustmentList({
  inventoryId,
  page,
  pageSize,
  signal,
}: {
  inventoryId: string
  page: number
  pageSize: number
  signal?: AbortSignal
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('jintan_inventory_adjustments')
    .select(
      'id, quantity_before, quantity_after, difference, remarks, operator_name, created_at',
      { count: 'exact' },
    )
    .eq('inventory_id', inventoryId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '获取库存调整记录失败')
  }

  return {
    items: (data || []) as JintanInventoryAdjustment[],
    total: count || 0,
  }
}
