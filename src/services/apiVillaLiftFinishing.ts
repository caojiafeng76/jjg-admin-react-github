import supabase from './supabase'
import { AppError, handleApiError } from '@/utils/errorHandler'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface VillaLiftFinishingRecord {
  id: string
  order_id: string
  model: string
  name: string
  spec: string
  operation: string
  operator: string
  process_quantity: number
  raw_scrap_quantity: number
  process_scrap_quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface VillaLiftFinishingRecordWithOrder
  extends VillaLiftFinishingRecord {
  order: {
    project_name: string
    customer: string
    product_name: string
    color: string
    quantity: number
  } | null
}

export interface VillaLiftFinishingRecordFormValues {
  model: string
  name: string
  spec: string
  operation: string
  operator: string
  process_quantity: number
  raw_scrap_quantity: number
  process_scrap_quantity: number
  remarks: string
}

export interface VillaLiftFinishingBatchFormValues {
  order_id: string
  operator: string
  rows: VillaLiftFinishingRecordFormValues[]
}

// ----------------------------------------------------------------
// Queries
// ----------------------------------------------------------------

export async function getVillaLiftFinishingRecords({
  page,
  pageSize,
  orderId,
}: {
  page: number
  pageSize: number
  orderId?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('villa_lift_finishing_records')
    .select(
      `*, order:villa_lift_orders(project_name, customer, product_name, color, quantity)`,
      { count: 'exact' },
    )

  if (orderId) {
    query = query.eq('order_id', orderId)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw handleApiError(error, '获取加工记录失败')
  return {
    records: data as VillaLiftFinishingRecordWithOrder[],
    count: count ?? 0,
  }
}

/**
 * 查询指定型号集合在 process_standards 中对应的工序列表，用于 operation 字段联动。
 * 返回 { model, operation }[] 去重后的列表，按 model / operation 排序。
 */
export async function getProcessOperationsByModels(
  models: string[],
): Promise<{ model: string; operation: string }[]> {
  if (!models.length) return []

  const { data, error } = await supabase
    .from('process_standards')
    .select('model, operation')
    .in('model', models)
    .order('model', { ascending: true })
    .order('operation', { ascending: true })

  if (error) throw handleApiError(error, '获取工序列表失败')

  // 去重
  const seen = new Set<string>()
  const result: { model: string; operation: string }[] = []
  for (const row of data ?? []) {
    const key = `${row.model}|${row.operation}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({ model: row.model, operation: row.operation })
    }
  }
  return result
}

// ----------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------

export async function createVillaLiftFinishingBatch({
  order_id,
  operator,
  rows,
}: VillaLiftFinishingBatchFormValues): Promise<void> {
  if (!rows || rows.length === 0)
    throw new AppError('请至少添加一条加工记录')

  const payloads = rows.map((r) => ({
    order_id,
    model: r.model?.trim() ?? '',
    name: r.name?.trim() ?? '',
    spec: r.spec?.trim() ?? '',
    operation: r.operation?.trim() ?? '',
    operator: operator?.trim() ?? '',
    process_quantity: Number(r.process_quantity ?? 0),
    raw_scrap_quantity: Number(r.raw_scrap_quantity ?? 0),
    process_scrap_quantity: Number(r.process_scrap_quantity ?? 0),
    remarks: r.remarks?.trim() ?? '',
  }))

  const { error } = await supabase
    .from('villa_lift_finishing_records')
    .insert(payloads)
  if (error) throw handleApiError(error, '创建加工记录失败')
}

export async function updateVillaLiftFinishingRecord({
  id,
  values,
}: {
  id: string
  values: VillaLiftFinishingRecordFormValues
}): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_finishing_records')
    .update({
      model: values.model?.trim() ?? '',
      name: values.name?.trim() ?? '',
      spec: values.spec?.trim() ?? '',
      operation: values.operation?.trim() ?? '',
      operator: values.operator?.trim() ?? '',
      process_quantity: Number(values.process_quantity ?? 0),
      raw_scrap_quantity: Number(values.raw_scrap_quantity ?? 0),
      process_scrap_quantity: Number(values.process_scrap_quantity ?? 0),
      remarks: values.remarks?.trim() ?? '',
    })
    .eq('id', id)

  if (error) throw handleApiError(error, '更新加工记录失败')
}

export async function deleteVillaLiftFinishingRecord(
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_finishing_records')
    .delete()
    .eq('id', id)

  if (error) throw handleApiError(error, '删除加工记录失败')
}
