import type { Dayjs } from 'dayjs'
import supabase from './supabase'
import { AppError, handleApiError } from '@/utils/errorHandler'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface VillaLiftOrderItem {
  id: string
  order_id: string
  model: string
  name: string
  spec: string
  quantity: number
  remarks: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type VillaLiftOrderStatus = 'open' | 'closed'

export interface VillaLiftOrder {
  id: string
  planned_delivery_date: string | null
  schedule_date: string | null
  delivery_date: string | null
  customer: string
  project_name: string
  product_name: string
  color: string
  quantity: number
  material_selection_date: string | null
  painting_date: string | null
  film_date: string | null
  cutting_required_date: string | null
  cutting_actual_date: string | null
  processing_required_date: string | null
  processing_actual_date: string | null
  inspection_date: string | null
  tinting_plan_date: string | null
  painting_plan_date: string | null
  film_plan_date: string | null
  assembly_date: string | null
  packaging_date: string | null
  remarks: string
  status: VillaLiftOrderStatus
  created_at: string
  updated_at: string
  items?: VillaLiftOrderItem[]
}

export interface VillaLiftOrderItemFormValues {
  model: string
  name: string
  spec: string
  quantity: number
  remarks: string
}

export interface VillaLiftOrderFormValues {
  planned_delivery_date: string | Dayjs | null
  schedule_date: string | Dayjs | null
  delivery_date: string | Dayjs | null
  customer: string
  project_name: string
  product_name: string
  color: string
  quantity: number
  material_selection_date: string | Dayjs | null
  painting_date: string | Dayjs | null
  film_date: string | Dayjs | null
  cutting_required_date: string | Dayjs | null
  cutting_actual_date: string | Dayjs | null
  processing_required_date: string | Dayjs | null
  processing_actual_date: string | Dayjs | null
  inspection_date: string | Dayjs | null
  tinting_plan_date: string | Dayjs | null
  painting_plan_date: string | Dayjs | null
  film_plan_date: string | Dayjs | null
  assembly_date: string | Dayjs | null
  packaging_date: string | Dayjs | null
  remarks: string
  status: VillaLiftOrderStatus
  items: VillaLiftOrderItemFormValues[]
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function normalizeOrderPayload(
  values: Omit<VillaLiftOrderFormValues, 'items'>,
) {
  return {
    planned_delivery_date: values.planned_delivery_date
      ? typeof values.planned_delivery_date === 'string'
        ? values.planned_delivery_date
        : values.planned_delivery_date.format('YYYY-MM-DD')
      : null,
    schedule_date: values.schedule_date
      ? typeof values.schedule_date === 'string'
        ? values.schedule_date
        : values.schedule_date.format('YYYY-MM-DD')
      : null,
    delivery_date: values.delivery_date
      ? typeof values.delivery_date === 'string'
        ? values.delivery_date
        : values.delivery_date.format('YYYY-MM-DD')
      : null,
    customer: values.customer?.trim() ?? '',
    project_name: values.project_name?.trim() ?? '',
    product_name: values.product_name?.trim() ?? '',
    color: values.color?.trim() ?? '',
    quantity: Number(values.quantity ?? 0),
    material_selection_date: values.material_selection_date
      ? typeof values.material_selection_date === 'string'
        ? values.material_selection_date
        : values.material_selection_date.format('YYYY-MM-DD')
      : null,
    painting_date: values.painting_date
      ? typeof values.painting_date === 'string'
        ? values.painting_date
        : values.painting_date.format('YYYY-MM-DD')
      : null,
    film_date: values.film_date
      ? typeof values.film_date === 'string'
        ? values.film_date
        : values.film_date.format('YYYY-MM-DD')
      : null,
    cutting_required_date: values.cutting_required_date
      ? typeof values.cutting_required_date === 'string'
        ? values.cutting_required_date
        : values.cutting_required_date.format('YYYY-MM-DD')
      : null,
    cutting_actual_date: values.cutting_actual_date
      ? typeof values.cutting_actual_date === 'string'
        ? values.cutting_actual_date
        : values.cutting_actual_date.format('YYYY-MM-DD')
      : null,
    processing_required_date: values.processing_required_date
      ? typeof values.processing_required_date === 'string'
        ? values.processing_required_date
        : values.processing_required_date.format('YYYY-MM-DD')
      : null,
    processing_actual_date: values.processing_actual_date
      ? typeof values.processing_actual_date === 'string'
        ? values.processing_actual_date
        : values.processing_actual_date.format('YYYY-MM-DD')
      : null,
    inspection_date: values.inspection_date
      ? typeof values.inspection_date === 'string'
        ? values.inspection_date
        : values.inspection_date.format('YYYY-MM-DD')
      : null,
    tinting_plan_date: values.tinting_plan_date
      ? typeof values.tinting_plan_date === 'string'
        ? values.tinting_plan_date
        : values.tinting_plan_date.format('YYYY-MM-DD')
      : null,
    painting_plan_date: values.painting_plan_date
      ? typeof values.painting_plan_date === 'string'
        ? values.painting_plan_date
        : values.painting_plan_date.format('YYYY-MM-DD')
      : null,
    film_plan_date: values.film_plan_date
      ? typeof values.film_plan_date === 'string'
        ? values.film_plan_date
        : values.film_plan_date.format('YYYY-MM-DD')
      : null,
    assembly_date: values.assembly_date
      ? typeof values.assembly_date === 'string'
        ? values.assembly_date
        : values.assembly_date.format('YYYY-MM-DD')
      : null,
    packaging_date: values.packaging_date
      ? typeof values.packaging_date === 'string'
        ? values.packaging_date
        : values.packaging_date.format('YYYY-MM-DD')
      : null,
    remarks: values.remarks?.trim() ?? '',
    status: values.status ?? 'open',
  }
}

function normalizeItemPayload(
  item: VillaLiftOrderItemFormValues,
  index: number,
) {
  return {
    model: item.model?.trim() ?? '',
    name: item.name?.trim() ?? '',
    spec: item.spec?.trim() ?? '',
    quantity: Number(item.quantity ?? 0),
    remarks: item.remarks?.trim() ?? '',
    sort_order: index,
  }
}

// ----------------------------------------------------------------
// Queries
// ----------------------------------------------------------------

export async function getVillaLiftOrders({
  page,
  pageSize,
  customer,
  projectName,
  productName,
  deliveryDateFrom,
  deliveryDateTo,
}: {
  page: number
  pageSize: number
  customer?: string
  projectName?: string
  productName?: string
  deliveryDateFrom?: string
  deliveryDateTo?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('villa_lift_orders').select('*', { count: 'exact' })

  if (customer?.trim()) {
    query = query.ilike('customer', `%${customer.trim()}%`)
  }
  if (projectName?.trim()) {
    query = query.ilike('project_name', `%${projectName.trim()}%`)
  }
  if (productName?.trim()) {
    query = query.ilike('product_name', `%${productName.trim()}%`)
  }

  if (deliveryDateFrom) {
    query = query.gte('delivery_date', deliveryDateFrom)
  }
  if (deliveryDateTo) {
    query = query.lte('delivery_date', deliveryDateTo)
  }

  const { data, error, count } = await query
    // 未结案（open）在前，已结案（closed）在后；同一状态内按计划交货日期升序
    .order('status', { ascending: false })
    .order('planned_delivery_date', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (error) throw handleApiError(error, '获取别墅梯订单列表失败')
  return { orders: data as VillaLiftOrder[], count: count ?? 0 }
}

export async function getVillaLiftOrderItems(
  orderId: string,
): Promise<VillaLiftOrderItem[]> {
  const { data, error } = await supabase
    .from('villa_lift_order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw handleApiError(error, '获取订单明细失败')
  return data as VillaLiftOrderItem[]
}

// ----------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------

export async function createVillaLiftOrder(
  values: VillaLiftOrderFormValues,
): Promise<VillaLiftOrder> {
  const { items, ...orderFields } = values
  const payload = normalizeOrderPayload(orderFields)

  const { data: order, error } = await supabase
    .from('villa_lift_orders')
    .insert(payload)
    .select()
    .single()

  if (error) {
    if (error.code === '23505')
      throw new AppError('项目名称已存在，请使用不同的名称')
    throw handleApiError(error, '创建别墅梯订单失败')
  }

  if (items && items.length > 0) {
    const itemPayloads = items.map((item, i) => ({
      ...normalizeItemPayload(item, i),
      order_id: (order as VillaLiftOrder).id,
    }))
    const { error: itemError } = await supabase
      .from('villa_lift_order_items')
      .insert(itemPayloads)
    if (itemError) throw handleApiError(itemError, '创建订单明细失败')
  }

  return order as VillaLiftOrder
}

export async function updateVillaLiftOrder({
  id,
  values,
}: {
  id: string
  values: Omit<VillaLiftOrderFormValues, 'items'>
}): Promise<VillaLiftOrder> {
  const payload = normalizeOrderPayload(values)

  const { data, error } = await supabase
    .from('villa_lift_orders')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505')
      throw new AppError('项目名称已存在，请使用不同的名称')
    throw handleApiError(error, '更新别墅梯订单失败')
  }
  return data as VillaLiftOrder
}

export async function deleteVillaLiftOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_orders')
    .delete()
    .eq('id', id)

  if (error) throw handleApiError(error, '删除别墅梯订单失败')
}

export async function updateVillaLiftOrderStatus({
  id,
  status,
}: {
  id: string
  status: VillaLiftOrderStatus
}): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_orders')
    .update({ status })
    .eq('id', id)

  if (error) throw handleApiError(error, '更新订单状态失败')
}

export async function batchDeleteVillaLiftOrders(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_orders')
    .delete()
    .in('id', ids)

  if (error) throw handleApiError(error, '批量删除别墅梯订单失败')
}

export async function batchUpdateVillaLiftOrdersStatus({
  ids,
  status,
}: {
  ids: string[]
  status: VillaLiftOrderStatus
}): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_orders')
    .update({ status })
    .in('id', ids)

  if (error) throw handleApiError(error, '批量更新订单状态失败')
}

export async function upsertVillaLiftOrderItems({
  orderId,
  items,
}: {
  orderId: string
  items: VillaLiftOrderItemFormValues[]
}): Promise<void> {
  // 先删除所有现有明细，再重新插入（简单可靠）
  const { error: delError } = await supabase
    .from('villa_lift_order_items')
    .delete()
    .eq('order_id', orderId)

  if (delError) throw handleApiError(delError, '更新订单明细失败')

  if (items.length === 0) return

  const payloads = items.map((item, i) => ({
    ...normalizeItemPayload(item, i),
    order_id: orderId,
  }))

  const { error } = await supabase
    .from('villa_lift_order_items')
    .insert(payloads)

  if (error) throw handleApiError(error, '保存订单明细失败')
}

export async function deleteVillaLiftOrderItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('villa_lift_order_items')
    .delete()
    .eq('id', id)

  if (error) throw handleApiError(error, '删除订单明细失败')
}
