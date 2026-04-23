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
  schedule_date: string | null
  delivery_date: string | null
  customer: string
  project_name: string
  product_name: string
  color: string
  quantity: number
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
  schedule_date: string | Dayjs | null
  delivery_date: string | Dayjs | null
  customer: string
  project_name: string
  product_name: string
  color: string
  quantity: number
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
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('villa_lift_orders').select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const kw = keyword.trim()
    query = query.or(
      `customer.ilike.%${kw}%,project_name.ilike.%${kw}%,product_name.ilike.%${kw}%`,
    )
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
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
