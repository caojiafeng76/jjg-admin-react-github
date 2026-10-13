import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from './database.types'
import type { ProductionOrderItem } from './apiProductionOrderItems'
import { resolveProductionOrderItemStandardSeconds } from './apiProductionOrderItems'
import type {
  ProductionOrder,
  ProductionOrderFilters,
  ProductionOrderInsert,
  ProductionOrderUpdate,
  ProductionOrderWithEmployee,
} from './apiProductionOrderTypes'

export * from './apiProductionOrderTypes'
export {
  PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE,
  getProductionOrdersForExport,
  getProductionOrdersForExportByFilters,
  getProductionOrdersForExportByFiltersChunked,
  getProductionOrdersForExportChunked,
} from './apiProductionOrderExportData'
export { getProductionItemsByProjectNo } from './apiProductionOrderProjectItems'

const PRODUCTION_ORDER_DETAIL_SELECT = `
      *,
  employee:employees(id, name, job_name, hourly_wage, coefficient, is_external),
      items:production_order_items(*)
    `

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
} & ProductionOrderFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const hasItemFilters = Boolean(dataCategory || productModel || customerModel)

  type ProductionOrderListRelation = Pick<
    Database['public']['Tables']['production_order_items']['Row'],
    | 'standard_seconds'
    | 'qualified_quantity'
    | 'qualified_hours'
    | 'defect_hours'
  >

  type ProductionOrderListQueryRow = ProductionOrderWithEmployee & {
    items?: ProductionOrderListRelation[]
  }

  const selectClause = `
      id, order_date, employee_id, is_audited, shift, work_hours, extra_qualified_hours, remark, updated_at,
      employee:employees(id, name),
      items:production_order_items(standard_seconds, qualified_quantity, qualified_hours, defect_hours)${hasItemFilters ? ',\n      item_filters:production_order_items!inner(id, data_category, product_model, customer_model)' : ''}
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
    ({ items: orderItems = [], ...order }) => {
      const positiveQualifiedHours = Number(
        orderItems
          .reduce((total, item) => total + Number(item.qualified_hours || 0), 0)
          .toFixed(2),
      )

      const totalDefectHours = Number(
        orderItems
          .reduce((total, item) => total + Number(item.defect_hours || 0), 0)
          .toFixed(2),
      )

      const extraQualifiedHours = Number(order.extra_qualified_hours ?? 0)
      const totalQualifiedHours = Number(
        (
          positiveQualifiedHours -
          totalDefectHours +
          extraQualifiedHours
        ).toFixed(2),
      )
      const workHours = Number(order.work_hours || 0)
      const efficiency = workHours > 0 ? totalQualifiedHours / workHours : 0

      return {
        ...order,
        positive_qualified_hours: positiveQualifiedHours,
        total_qualified_hours: totalQualifiedHours,
        efficiency,
        hasZeroStandardQualifiedItem: orderItems.some(
          (item) =>
            Number(item.qualified_hours || 0) === 0 &&
            Number(item.qualified_quantity || 0) > 0,
        ),
      }
    },
  )

  return {
    items,
    total: count || 0,
  }
}

export async function getProductionOrderById(id: string) {
  const { data, error } = await supabase
    .from('production_orders')
    .select(PRODUCTION_ORDER_DETAIL_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取生产工单详情失败')
  }

  const order = data as unknown as ProductionOrderWithEmployee & {
    items: ProductionOrderItem[]
  }

  return {
    ...order,
    items: await resolveProductionOrderItemStandardSeconds(order.items || []),
  }
}

export async function createProductionOrder(values: ProductionOrderInsert) {
  if (
    values.work_hours === null ||
    values.work_hours === undefined ||
    values.work_hours < 0
  ) {
    throw new Error('出勤工时不能小于0')
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
    if (
      error.code === '23505' &&
      error.message.includes('production_orders_employee_id_order_date_unique')
    ) {
      throw new Error('该员工当天已有工单，同一天只能创建一张工单')
    }

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
    values.work_hours < 0
  ) {
    throw new Error('出勤工时不能小于0')
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

export async function checkEmployeeOrderExistsOnDate(
  employeeId: string,
  orderDate: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from('production_orders')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', employeeId)
    .eq('order_date', orderDate)

  if (error) {
    throw handleApiError(error, '检查工单失败')
  }

  return (count ?? 0) > 0
}

export async function getEmployeeOrderByDate(
  employeeId: string,
  orderDate: string,
): Promise<ProductionOrder | null> {
  const { data, error } = await supabase
    .from('production_orders')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('order_date', orderDate)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取当天工单失败')
  }

  return (data as ProductionOrder | null) ?? null
}
