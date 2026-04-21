import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from './database.types'
import { getStandardSeconds } from './apiProcessStandards'

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

interface SalesOrderStandardContext {
  project_no: string
  length_mm: number | null
  material_code: string | null
}

type ProductionOrderItemDerivedFields = {
  standard_seconds: number
  qualified_quantity?: number | null
  qualified_hours?: number | null
  defect_quantity_1?: number | null
  defect_quantity_2?: number | null
  defect_reason_1?: string | null
  defect_reason_2?: string | null
  defect_hours?: number | null
}

function calculateQualifiedHours(
  standardSeconds: number,
  qualifiedQuantity: number | null | undefined,
) {
  const normalizedStandardSeconds = Number(standardSeconds || 0)
  const normalizedQualifiedQuantity = Number(qualifiedQuantity || 0)

  if (normalizedStandardSeconds <= 0 || normalizedQualifiedQuantity <= 0) {
    return 0
  }

  return Number(
    ((normalizedStandardSeconds * normalizedQualifiedQuantity) / 3600).toFixed(
      2,
    ),
  )
}

function calculateDefectHours(item: {
  standard_seconds: number
  defect_quantity_1?: number | null
  defect_quantity_2?: number | null
  defect_reason_1?: string | null
  defect_reason_2?: string | null
}) {
  const normalizedStandardSeconds = Number(item.standard_seconds || 0)

  if (normalizedStandardSeconds <= 0) {
    return 0
  }

  const defectSeconds =
    (item.defect_reason_1 === '加工'
      ? Number(item.defect_quantity_1 || 0) * 2 * normalizedStandardSeconds
      : 0) +
    (item.defect_reason_2 === '加工'
      ? Number(item.defect_quantity_2 || 0) * 2 * normalizedStandardSeconds
      : 0)

  return Number((defectSeconds / 3600).toFixed(2))
}

function applyDerivedHours<TItem extends ProductionOrderItemDerivedFields>(
  item: TItem,
  standardSeconds = item.standard_seconds,
): TItem {
  const nextItem = {
    ...item,
    standard_seconds: standardSeconds,
  }

  if ('qualified_hours' in item) {
    nextItem.qualified_hours = calculateQualifiedHours(
      standardSeconds,
      item.qualified_quantity,
    )
  }

  if ('defect_hours' in item) {
    nextItem.defect_hours = calculateDefectHours({
      standard_seconds: standardSeconds,
      defect_quantity_1: item.defect_quantity_1,
      defect_quantity_2: item.defect_quantity_2,
      defect_reason_1: item.defect_reason_1,
      defect_reason_2: item.defect_reason_2,
    })
  }

  return nextItem
}

async function resolveProductionOrderItemStandardSeconds<
  TItem extends {
    project_no: string
    product_model: string | null
    length_mm: number | null
    operation: string
    standard_seconds: number
  },
>(items: TItem[]): Promise<TItem[]> {
  const missingStandardItems = items.filter(
    (item) =>
      Number(item.standard_seconds || 0) <= 0 &&
      Boolean(item.project_no?.trim()) &&
      Boolean(item.product_model?.trim()) &&
      Boolean(item.operation?.trim()),
  )

  if (missingStandardItems.length === 0) {
    return items
  }

  const projectNos = Array.from(
    new Set(
      missingStandardItems
        .map((item) => item.project_no.trim())
        .filter(Boolean),
    ),
  )

  const salesOrderContextMap = new Map<string, SalesOrderStandardContext>()

  if (projectNos.length > 0) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('project_no, length_mm, material_code')
      .in('project_no', projectNos)

    if (error) {
      throw handleApiError(error, '获取工单项目号匹配信息失败')
    }

    ;((data || []) as SalesOrderStandardContext[]).forEach((row) => {
      if (!row.project_no || salesOrderContextMap.has(row.project_no)) {
        return
      }

      salesOrderContextMap.set(row.project_no, row)
    })
  }

  const standardSecondsCache = new Map<string, number>()

  return Promise.all(
    items.map(async (item) => {
      if (Number(item.standard_seconds || 0) > 0) {
        return applyDerivedHours(item)
      }

      const normalizedProjectNo = item.project_no?.trim()
      const normalizedModel = item.product_model?.trim()
      const normalizedOperation = item.operation?.trim()

      if (!normalizedProjectNo || !normalizedModel || !normalizedOperation) {
        return item
      }

      const salesOrderContext = salesOrderContextMap.get(normalizedProjectNo)
      const length = salesOrderContext?.length_mm ?? item.length_mm
      const partNo = salesOrderContext?.material_code ?? null
      const cacheKey = [
        normalizedModel,
        normalizedOperation,
        length ?? '',
        partNo ?? '',
      ].join('::')

      let resolvedStandardSeconds = standardSecondsCache.get(cacheKey)

      if (resolvedStandardSeconds === undefined) {
        try {
          resolvedStandardSeconds = await getStandardSeconds({
            model: normalizedModel,
            operation: normalizedOperation,
            length,
            partNo,
          })
        } catch {
          resolvedStandardSeconds = 0
        }

        standardSecondsCache.set(cacheKey, resolvedStandardSeconds)
      }

      if (resolvedStandardSeconds > 0) {
        return applyDerivedHours(item, resolvedStandardSeconds)
      }

      return item
    }),
  )
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

  return resolveProductionOrderItemStandardSeconds(
    (data || []) as unknown as ProductionOrderItemWithMachine[],
  )
}

export { resolveProductionOrderItemStandardSeconds, calculateQualifiedHours }

export async function addProductionOrderItem(
  values: ProductionOrderItemInsert,
) {
  // 写入前若 standard_seconds = 0，尝试从工序标准表动态查找正确的值
  // qualified_hours / defect_hours 是数据库生成列，由 DB 根据 standard_seconds 自动计算，无需写入
  const itemForResolve = {
    project_no: (values.project_no as string | null | undefined) ?? '',
    product_model: values.product_model ?? null,
    length_mm:
      (values as unknown as { length_mm?: number | null }).length_mm ?? null,
    operation: (values.operation as string | null | undefined) ?? '',
    standard_seconds: Number(values.standard_seconds ?? 0),
  }
  const [resolved] = await resolveProductionOrderItemStandardSeconds([
    itemForResolve,
  ])

  const payload = buildProductionOrderItemInsertPayload({
    ...values,
    standard_seconds: resolved.standard_seconds,
  })

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
  // 写入前若 standard_seconds = 0，尝试从工序标准表动态查找正确的值
  // qualified_hours / defect_hours 是数据库生成列，由 DB 根据 standard_seconds 自动计算，无需写入
  const itemForResolve = {
    project_no: (values.project_no as string | null | undefined) ?? '',
    product_model: values.product_model ?? null,
    length_mm:
      (values as unknown as { length_mm?: number | null }).length_mm ?? null,
    operation: (values.operation as string | null | undefined) ?? '',
    standard_seconds: Number(values.standard_seconds ?? 0),
  }
  const [resolved] = await resolveProductionOrderItemStandardSeconds([
    itemForResolve,
  ])

  const payload = buildProductionOrderItemUpdatePayload({
    ...values,
    standard_seconds: resolved.standard_seconds,
  })

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
