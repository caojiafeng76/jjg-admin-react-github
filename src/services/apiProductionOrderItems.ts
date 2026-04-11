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

type ProductionOrderItemExtraFields = {
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  setup_defect_quantity: number
  setup_responsible: string | null
}

export type ProductionOrderItem = ProductionOrderItemRowBase &
  ProductionOrderItemExtraFields & {
  data_category: ProductionOrderDataCategory
}
export type ProductionOrderItemInsert = ProductionOrderItemInsertBase &
  Partial<ProductionOrderItemExtraFields> & {
  data_category?: ProductionOrderDataCategory
}
export type ProductionOrderItemUpdate = ProductionOrderItemUpdateBase &
  Partial<ProductionOrderItemExtraFields> & {
  data_category?: ProductionOrderDataCategory
}

type ProductionOrderItemInsertPayload = ProductionOrderItemInsertBase &
  Partial<ProductionOrderItemExtraFields>
type ProductionOrderItemUpdatePayload = ProductionOrderItemUpdateBase &
  Partial<ProductionOrderItemExtraFields>

export type ProductionOrderItemWithMachine = ProductionOrderItem & {
  machine_equipment_maintenances: {
    unified_device_no: string
    operation: string
    machine_name: string
  } | null
}

function buildProductionOrderItemInsertPayload(
  values: ProductionOrderItemInsert,
): ProductionOrderItemInsertPayload {
  return {
    ...values,
    outsource_defect_quantity: Number(values.outsource_defect_quantity ?? 0),
    outsource_defect_reason: values.outsource_defect_reason ?? null,
    outsource_unit: values.outsource_unit ?? null,
    setup_defect_quantity: Number(values.setup_defect_quantity ?? 0),
    setup_responsible: values.setup_responsible ?? null,
  }
}

function buildProductionOrderItemUpdatePayload(
  values: ProductionOrderItemUpdate,
): ProductionOrderItemUpdatePayload {
  return {
    ...values,
    ...(values.outsource_defect_quantity !== undefined
      ? {
          outsource_defect_quantity: Number(values.outsource_defect_quantity),
        }
      : {}),
    ...(values.outsource_defect_reason !== undefined
      ? { outsource_defect_reason: values.outsource_defect_reason ?? null }
      : {}),
    ...(values.outsource_unit !== undefined
      ? { outsource_unit: values.outsource_unit ?? null }
      : {}),
    ...(values.setup_defect_quantity !== undefined
      ? { setup_defect_quantity: Number(values.setup_defect_quantity) }
      : {}),
    ...(values.setup_responsible !== undefined
      ? { setup_responsible: values.setup_responsible ?? null }
      : {}),
  }
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
  const payload = buildProductionOrderItemInsertPayload(values)

  const { data, error } = await supabase
    .from('production_order_items')
    .insert(payload as ProductionOrderItemInsertBase)
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
  const payload = buildProductionOrderItemUpdatePayload(values)

  const { data, error } = await supabase
    .from('production_order_items')
    .update(payload as ProductionOrderItemUpdateBase)
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
