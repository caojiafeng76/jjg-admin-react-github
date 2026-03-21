import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from './database.types'

export type ProductionOrderItem =
  Database['public']['Tables']['production_order_items']['Row']
export type ProductionOrderItemInsert =
  Database['public']['Tables']['production_order_items']['Insert']
export type ProductionOrderItemUpdate =
  Database['public']['Tables']['production_order_items']['Update']

export async function getProductionOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('production_order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取工序明细失败')
  }

  return (data || []) as ProductionOrderItem[]
}

export async function addProductionOrderItem(
  values: ProductionOrderItemInsert,
) {
  const { data, error } = await supabase
    .from('production_order_items')
    .insert(values)
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '添加工序明细失败')
  }

  return data as ProductionOrderItem
}

export async function updateProductionOrderItem({
  id,
  values,
}: {
  id: string
  values: ProductionOrderItemUpdate
}) {
  const { data, error } = await supabase
    .from('production_order_items')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '更新工序明细失败')
  }

  return data as ProductionOrderItem
}

export async function deleteProductionOrderItems(ids: string[]) {
  const { error } = await supabase
    .from('production_order_items')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除工序明细失败')
  }
}
