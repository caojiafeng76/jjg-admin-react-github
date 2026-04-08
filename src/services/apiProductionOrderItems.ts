import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from './database.types'

export type ProductionOrderDataCategory = 'A' | 'B'

type ProductionOrderItemRowBase =
  Database['public']['Tables']['production_order_items']['Row']
type ProductionOrderItemInsertBase =
  Database['public']['Tables']['production_order_items']['Insert']
type ProductionOrderItemUpdateBase =
  Database['public']['Tables']['production_order_items']['Update']

export type ProductionOrderItem = ProductionOrderItemRowBase & {
  data_category: ProductionOrderDataCategory
}
export type ProductionOrderItemInsert = ProductionOrderItemInsertBase & {
  data_category?: ProductionOrderDataCategory
}
export type ProductionOrderItemUpdate = ProductionOrderItemUpdateBase & {
  data_category?: ProductionOrderDataCategory
}

export type ProductionOrderItemWithMachine = ProductionOrderItem & {
  machine_equipment_maintenances: {
    unified_device_no: string
    operation: string
    machine_name: string
  } | null
}

export async function getProductionOrderItems(orderId: string) {
  const { data, error } = await supabase
    .from('production_order_items')
    .select(
      '*, machine_equipment_maintenances!machine_equipment_id(unified_device_no, operation, machine_name)',
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取工序明细失败')
  }

  return (data || []) as unknown as ProductionOrderItemWithMachine[]
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
