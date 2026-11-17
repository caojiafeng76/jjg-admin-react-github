import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

export interface YoumaiFinishedGoodsInventoryAdjustment {
  id: string
  inventory_id: string
  product_data_id: string
  quantity_before: number
  quantity_after: number
  difference: number
  remarks: string
  operator_name: string
  created_at: string
}

interface DynamicSupabaseTable {
  from: (table: string) => any
}

function adjustmentsTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'youmai_finished_goods_inventory_adjustments',
  )
}

/** 单个优迈货品的成品库存调整流水（由数据库触发器写入，前端只读） */
export async function getYoumaiFinishedGoodsInventoryAdjustmentList({
  productDataId,
  page,
  pageSize,
  signal,
}: {
  productDataId: string
  page: number
  pageSize: number
  signal?: AbortSignal
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = adjustmentsTable()
    .select(
      'id, inventory_id, product_data_id, quantity_before, quantity_after, difference, remarks, operator_name, created_at',
      { count: 'exact' },
    )
    .eq('product_data_id', productDataId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '获取优迈成品库存调整记录失败')
  }

  return {
    items: (data || []) as YoumaiFinishedGoodsInventoryAdjustment[],
    total: count || 0,
  }
}
