import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from '@/types/database.types'

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

export async function getProductionOrders({
  page,
  pageSize,
  startDate,
  endDate,
  employeeId,
  status,
}: {
  page: number
  pageSize: number
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('production_orders')
    .select(
      `
      *,
      employee:employees(id, name)
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

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取生产工单列表失败')
  }

  return {
    items: (data || []) as ProductionOrderWithEmployee[],
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

export async function createProductionOrder(values: ProductionOrderInsert) {
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
