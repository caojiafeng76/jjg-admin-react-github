import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from './database.types'
import type {
  ProductionOrderDataCategory,
  ProductionOrderItem,
} from './apiProductionOrderItems'

export type ProductionOrderShift = '白班' | '夜班'

export type ProductionOrder =
  Database['public']['Tables']['production_orders']['Row'] & {
    shift: ProductionOrderShift
  }
export type ProductionOrderInsert =
  Database['public']['Tables']['production_orders']['Insert'] & {
    shift?: ProductionOrderShift
  }
export type ProductionOrderUpdate =
  Database['public']['Tables']['production_orders']['Update'] & {
    shift?: ProductionOrderShift
  }

export interface ProductionOrderWithEmployee extends ProductionOrder {
  employee?: {
    id: string
    name: string
  }
}

export interface ProductionOrderListItem extends ProductionOrderWithEmployee {
  hasZeroStandardQualifiedItem?: boolean
  positive_qualified_hours?: number
}

export interface ProductionOrderForExport extends ProductionOrderWithEmployee {
  items: ProductionOrderItem[]
}

export async function getProductionOrders({
  page,
  pageSize,
  startDate,
  endDate,
  employeeId,
  shift,
  dataCategory,
  productModel,
  customerModel,
  isAudited,
}: {
  page: number
  pageSize: number
  startDate?: string
  endDate?: string
  employeeId?: string
  shift?: ProductionOrderShift
  dataCategory?: ProductionOrderDataCategory
  productModel?: string
  customerModel?: string
  isAudited?: boolean
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const hasItemFilters = Boolean(dataCategory || productModel || customerModel)

  type ProductionOrderListRelation = Pick<
    Database['public']['Tables']['production_order_items']['Row'],
    'standard_seconds' | 'qualified_quantity' | 'qualified_hours'
  >

  type ProductionOrderListQueryRow = ProductionOrderWithEmployee & {
    items?: ProductionOrderListRelation[]
  }

  const selectClause = `
      *,
      employee:employees(id, name),
      items:production_order_items(standard_seconds, qualified_quantity, qualified_hours)${hasItemFilters ? ',\n      item_filters:production_order_items!inner(id, data_category, product_model, customer_model)' : ''}
    `

  let query = supabase
    .from('production_orders')
    .select(selectClause, { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('order_date', { ascending: false })

  if (startDate) {
    query = query.gte('order_date', startDate)
  }

  if (endDate) {
    query = query.lte('order_date', endDate)
  }

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  if (shift) {
    query = (
      query as typeof query & {
        eq: (column: string, value: string) => typeof query
      }
    ).eq('shift', shift)
  }

  if (dataCategory) {
    query = (
      query as typeof query & {
        eq: (column: string, value: string) => typeof query
      }
    ).eq('item_filters.data_category', dataCategory)
  }

  if (typeof isAudited === 'boolean') {
    query = query.eq('is_audited', isAudited)
  }

  if (productModel) {
    query = query.ilike('item_filters.product_model', `%${productModel}%`)
  }

  if (customerModel) {
    query = query.ilike('item_filters.customer_model', `%${customerModel}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取生产工单列表失败')
  }

  const items = ((data || []) as unknown as ProductionOrderListQueryRow[]).map(
    ({ items: orderItems = [], ...order }) => ({
      ...order,
      positive_qualified_hours: Number(
        orderItems
          .reduce((total, item) => total + Number(item.qualified_hours || 0), 0)
          .toFixed(2),
      ),
      hasZeroStandardQualifiedItem: orderItems.some(
        (item) =>
          Number(item.standard_seconds || 0) === 0 &&
          Number(item.qualified_quantity || 0) > 0,
      ),
    }),
  )

  return {
    items,
    total: count || 0,
  }
}

export async function getProductionOrderById(id: string) {
  const { data, error } = await supabase
    .from('production_orders')
    .select(
      `
      *,
      employee:employees(id, name),
      items:production_order_items(*)
    `,
    )
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取生产工单详情失败')
  }

  return data as ProductionOrderWithEmployee & {
    items: ProductionOrderItem[]
  }
}

export async function getProductionOrdersForExport(ids: string[]) {
  if (ids.length === 0) {
    return [] as ProductionOrderForExport[]
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  const rows = (await Promise.all(
    uniqueIds.map((id) => getProductionOrderById(id)),
  )) as ProductionOrderForExport[]

  return rows.sort((left, right) => {
    const dateCompare = left.order_date.localeCompare(right.order_date)

    if (dateCompare !== 0) {
      return dateCompare
    }

    return left.created_at.localeCompare(right.created_at)
  })
}

export async function createProductionOrder(values: ProductionOrderInsert) {
  if (
    values.work_hours === null ||
    values.work_hours === undefined ||
    values.work_hours <= 0
  ) {
    throw new Error('出勤工时必须大于0')
  }

  if (
    values.extra_qualified_hours !== undefined &&
    values.extra_qualified_hours !== null &&
    values.extra_qualified_hours < 0
  ) {
    throw new Error('零工工时不能小于0')
  }

  const { data, error } = await supabase
    .from('production_orders')
    .insert(values)
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '创建生产工单失败')
  }

  return data as ProductionOrder
}

export async function updateProductionOrder({
  id,
  values,
}: {
  id: string
  values: ProductionOrderUpdate
}) {
  if (
    values.work_hours !== undefined &&
    values.work_hours !== null &&
    values.work_hours <= 0
  ) {
    throw new Error('出勤工时必须大于0')
  }

  if (
    values.extra_qualified_hours !== undefined &&
    values.extra_qualified_hours !== null &&
    values.extra_qualified_hours < 0
  ) {
    throw new Error('零工工时不能小于0')
  }

  const { data, error } = await supabase
    .from('production_orders')
    .update(values)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '更新生产工单失败')
  }

  return data as ProductionOrder
}

export async function deleteProductionOrders(ids: string[]) {
  const { error } = await supabase
    .from('production_orders')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除生产工单失败')
  }
}

export async function updateProductionOrders({
  ids,
  values,
}: {
  ids: string[]
  values: ProductionOrderUpdate
}) {
  if (ids.length === 0) {
    return [] as ProductionOrder[]
  }

  const { data, error } = await supabase
    .from('production_orders')
    .update(values)
    .in('id', ids)
    .select()

  if (error) {
    throw handleApiError(error, '批量更新生产工单失败')
  }

  return (data || []) as ProductionOrder[]
}
