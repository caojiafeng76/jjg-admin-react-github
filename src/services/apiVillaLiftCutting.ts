import supabase from './supabase'
import { AppError, handleApiError } from '@/utils/errorHandler'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface VillaLiftCuttingRecord {
  id: string
  order_id: string
  model: string
  name: string
  spec: string
  operator: string
  cut_quantity: number
  raw_scrap_quantity: number
  process_scrap_quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface VillaLiftCuttingRecordWithOrder extends VillaLiftCuttingRecord {
  order: {
    project_name: string
    customer: string
    product_name: string
    color: string
    quantity: number
  } | null
}

export interface VillaLiftCuttingRecordFormValues {
  model: string
  name: string
  spec: string
  operator: string
  cut_quantity: number
  raw_scrap_quantity: number
  process_scrap_quantity: number
  remarks: string
}

export interface VillaLiftCuttingBatchFormValues {
  order_id: string
  operator: string
  rows: VillaLiftCuttingRecordFormValues[]
}

export interface VillaLiftOrderSelectOption {
  id: string
  project_name: string
  customer: string
  product_name: string
  color: string
  quantity: number
  status: string
}

// ----------------------------------------------------------------
// Queries
// ----------------------------------------------------------------

export async function getVillaLiftOrdersForSelect(): Promise<
  VillaLiftOrderSelectOption[]
> {
  const { data, error } = await supabase
    .from('villa_lift_orders')
    .select('id, project_name, customer, product_name, color, quantity, status')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) throw handleApiError(error, '获取订单列表失败')
  return data as VillaLiftOrderSelectOption[]
}

export async function getVillaLiftCuttingRecords({
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
    .from('villa_lift_cutting_records')
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

  if (error) throw handleApiError(error, '获取切割记录失败')
  return {
    records: data as VillaLiftCuttingRecordWithOrder[],
    count: count ?? 0,
  }
}

// ----------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------

export async function createVillaLiftCuttingBatch({
  order_id,
  operator,
  rows,
}: VillaLiftCuttingBatchFormValues): Promise<void> {
  if (!rows || rows.length === 0) throw new AppError('请至少添加一条切割记录')

  const payloads = rows.map((r) => ({
    order_id,
    model: r.model?.trim() ?? '',
    name: r.name?.trim() ?? '',
    spec: r.spec?.trim() ?? '',
    operator: operator?.trim() ?? '',
    cut_quantity: Number(r.cut_quantity ?? 0),
    raw_scrap_quantity: Number(r.raw_scrap_quantity ?? 0),
    process_scrap_quantity: Number(r.process_scrap_quantity ?? 0),
    remarks: r.remarks?.trim() ?? '',
  }))

  const { error } = await supabase
    .from('villa_lift_cutting_records')
    .insert(payloads)
  if (error) throw handleApiError(error, '创建切割记录失败')
}

export async function updateVillaLiftCuttingRecord({
  id,
  values,
}: {
  id: string
  values: VillaLiftCuttingRecordFormValues
}): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_cutting_records')
    .update({
      model: values.model?.trim() ?? '',
      name: values.name?.trim() ?? '',
      spec: values.spec?.trim() ?? '',
      operator: values.operator?.trim() ?? '',
      cut_quantity: Number(values.cut_quantity ?? 0),
      raw_scrap_quantity: Number(values.raw_scrap_quantity ?? 0),
      process_scrap_quantity: Number(values.process_scrap_quantity ?? 0),
      remarks: values.remarks?.trim() ?? '',
    })
    .eq('id', id)

  if (error) throw handleApiError(error, '更新切割记录失败')
}

export async function deleteVillaLiftCuttingRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_cutting_records')
    .delete()
    .eq('id', id)

  if (error) throw handleApiError(error, '删除切割记录失败')
}

export async function batchDeleteVillaLiftCuttingRecords(
  ids: string[],
): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_cutting_records')
    .delete()
    .in('id', ids)

  if (error) throw handleApiError(error, '批量删除切割记录失败')
}
