import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from './database.types'

export type ProductionOrder =
  Database['public']['Tables']['production_orders']['Row']
export type ProductionOrderInsert =
  Database['public']['Tables']['production_orders']['Insert']
export type ProductionOrderUpdate =
  Database['public']['Tables']['production_orders']['Update']

export interface ProductionOrderWithEmployee extends ProductionOrder {
  employee?: {
    id: string
    name: string
  }
}

export interface ProductionOrderListItem extends ProductionOrderWithEmployee {
  hasZeroStandardQualifiedItem?: boolean
}

export interface ProductionOrderForExport extends ProductionOrderWithEmployee {
  items: Database['public']['Tables']['production_order_items']['Row'][]
}

export async function getProductionOrders({
  page,
  pageSize,
  startDate,
  endDate,
  employeeId,
}: {
  page: number
  pageSize: number
  startDate?: string
  endDate?: string
  employeeId?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  type ProductionOrderListRelation = Pick<
    Database['public']['Tables']['production_order_items']['Row'],
    'standard_seconds' | 'qualified_quantity'
  >

  type ProductionOrderListQueryRow = ProductionOrderWithEmployee & {
    items?: ProductionOrderListRelation[]
  }

  let query = supabase
    .from('production_orders')
    .select(
      `
      *,
      employee:employees(id, name),
      items:production_order_items(standard_seconds, qualified_quantity)
    `,
      { count: 'exact' },
    )
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

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取生产工单列表失败')
  }

  const items = ((data || []) as ProductionOrderListQueryRow[]).map(
    ({ items: orderItems = [], ...order }) => ({
      ...order,
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
    items: Database['public']['Tables']['production_order_items']['Row'][]
  }
}

export async function getProductionOrdersForExport(ids: string[]) {
  if (ids.length === 0) {
    return [] as ProductionOrderForExport[]
  }

  const { data, error } = await supabase
    .from('production_orders')
    .select(
      `
      *,
      employee:employees(id, name),
      items:production_order_items(*)
    `,
    )
    .in('id', ids)
    .order('order_date', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取生产工单导出数据失败')
  }

  const rows = (data || []) as ProductionOrderForExport[]
  const orderMap = new Map(rows.map((row) => [row.id, row]))

  return ids
    .map((id) => orderMap.get(id))
    .filter((row): row is ProductionOrderForExport => Boolean(row))
}

export async function createProductionOrder(values: ProductionOrderInsert) {
  if (
    values.work_hours === null ||
    values.work_hours === undefined ||
    values.work_hours <= 0
  ) {
    throw new Error('出勤工时必须大于0')
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
