import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import { Database } from './database.types'
import type {
  ProductionOrderDataCategory,
  ProductionOrderItem,
} from './apiProductionOrderItems'
import { resolveProductionOrderItemStandardSeconds } from './apiProductionOrderItems'

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
    job_name?: string | null
    hourly_wage?: number | null
    coefficient?: number | null
    is_external?: boolean | null
  }
}

export interface ProductionOrderListItem extends ProductionOrderWithEmployee {
  hasZeroStandardQualifiedItem?: boolean
  positive_qualified_hours?: number
}

export interface ProductionOrderForExport extends ProductionOrderWithEmployee {
  items: ProductionOrderItem[]
}

export interface ProductionOrderFilters {
  startDate?: string
  endDate?: string
  employeeId?: string
  shift?: ProductionOrderShift
  dataCategory?: ProductionOrderDataCategory
  productModel?: string
  customerModel?: string
  isAudited?: boolean
}

const PRODUCTION_ORDER_DETAIL_SELECT = `
      *,
  employee:employees(id, name, job_name, hourly_wage, coefficient, is_external),
      items:production_order_items(*)
    `

const PRODUCTION_ORDER_EXPORT_SELECT = `
      id,
      created_at,
      order_date,
      work_hours,
      extra_qualified_hours,
      total_qualified_hours,
      efficiency,
      shift,
      remark,
      employee:employees(id, name, job_name, hourly_wage, coefficient, is_external),
      items:production_order_items(
        id,
        data_category,
        project_no,
        product_model,
        customer_model,
        length_mm,
        operation,
        standard_seconds,
        incoming_qualified_quantity,
        qualified_quantity,
        qualified_hours,
        defect_quantity_1,
        defect_quantity_2,
        defect_hours,
        remark
      )
    `

const PRODUCTION_ORDER_EXPORT_BATCH_SIZE = 200

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
      *,
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

async function getProductionOrdersForExportBatch(ids: string[]) {
  const { data, error } = await supabase
    .from('production_orders')
    .select(PRODUCTION_ORDER_EXPORT_SELECT)
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '获取导出工单失败')
  }

  return (data || []) as unknown as ProductionOrderForExport[]
}

export async function getProductionOrdersForExport(ids: string[]) {
  if (ids.length === 0) {
    return [] as ProductionOrderForExport[]
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  const batches: string[][] = []

  for (
    let index = 0;
    index < uniqueIds.length;
    index += PRODUCTION_ORDER_EXPORT_BATCH_SIZE
  ) {
    batches.push(
      uniqueIds.slice(index, index + PRODUCTION_ORDER_EXPORT_BATCH_SIZE),
    )
  }

  const rows = (
    await Promise.all(
      batches.map((batchIds) => getProductionOrdersForExportBatch(batchIds)),
    )
  ).flat()
  const rowMap = new Map(rows.map((row) => [row.id, row]))

  return sortProductionOrdersForExport(
    uniqueIds
      .map((id) => rowMap.get(id))
      .filter((row): row is ProductionOrderForExport => Boolean(row)),
  )
}

const PRODUCTION_ORDER_FILTER_EXPORT_PAGE_SIZE = 1000
const PRODUCTION_ORDER_FILTER_EXPORT_PAGE_CONCURRENCY = 5
export const PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE = 30

export interface ProductionOrderExportProgress {
  loaded: number
  total: number
}

function compareProductionOrdersForExport(
  left: ProductionOrderForExport,
  right: ProductionOrderForExport,
) {
  const dateCompare = left.order_date.localeCompare(right.order_date)

  if (dateCompare !== 0) {
    return dateCompare
  }

  return left.created_at.localeCompare(right.created_at)
}

function sortProductionOrdersForExport(rows: ProductionOrderForExport[]) {
  return [...rows].sort(compareProductionOrdersForExport)
}

async function getProductionOrderIdsPageByFilters({
  page,
  pageSize,
  withCount = true,
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
  withCount?: boolean
} & ProductionOrderFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const hasItemFilters = Boolean(dataCategory || productModel || customerModel)
  const selectClause = `
      id${hasItemFilters ? ',\n      item_filters:production_order_items!inner(id, data_category, product_model, customer_model)' : ''}
    `

  let query = (
    withCount
      ? supabase.from('production_orders').select(selectClause, {
          count: 'exact',
        })
      : supabase.from('production_orders').select(selectClause)
  )
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
    throw handleApiError(error, '获取导出工单失败')
  }

  return {
    ids: ((data || []) as unknown as Array<{ id: string }>).map(
      (item) => item.id,
    ),
    total: count ?? 0,
  }
}

export async function getProductionOrdersForExportChunked(
  ids: string[],
  options?: {
    chunkSize?: number
    onProgress?: (progress: ProductionOrderExportProgress) => void
  },
) {
  if (ids.length === 0) {
    return [] as ProductionOrderForExport[]
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  const chunkSize =
    options?.chunkSize ?? PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE
  const rows: ProductionOrderForExport[] = []

  for (let index = 0; index < uniqueIds.length; index += chunkSize) {
    const chunkIds = uniqueIds.slice(index, index + chunkSize)
    rows.push(...(await getProductionOrdersForExport(chunkIds)))
    options?.onProgress?.({
      loaded: Math.min(rows.length, uniqueIds.length),
      total: uniqueIds.length,
    })
  }

  return sortProductionOrdersForExport(rows)
}

export async function getProductionOrdersForExportByFiltersChunked(
  filters: ProductionOrderFilters,
  options?: {
    pageSize?: number
    onProgress?: (progress: ProductionOrderExportProgress) => void
  },
) {
  const pageSize =
    options?.pageSize ?? PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE
  const firstPage = await getProductionOrderIdsPageByFilters({
    page: 1,
    pageSize,
    withCount: true,
    ...filters,
  })
  const total = firstPage.total
  const rows: ProductionOrderForExport[] = []

  if (total === 0) {
    options?.onProgress?.({ loaded: 0, total: 0 })
    return rows
  }

  const appendPageOrders = async (ids: string[]) => {
    if (ids.length === 0) {
      return
    }

    rows.push(...(await getProductionOrdersForExport(ids)))
    options?.onProgress?.({
      loaded: Math.min(rows.length, total),
      total,
    })
  }

  await appendPageOrders(firstPage.ids)

  const totalPages = Math.ceil(total / pageSize)

  for (let page = 2; page <= totalPages; page += 1) {
    const pageResult = await getProductionOrderIdsPageByFilters({
      page,
      pageSize,
      withCount: false,
      ...filters,
    })

    await appendPageOrders(pageResult.ids)
  }

  return sortProductionOrdersForExport(rows)
}

export async function getProductionOrdersForExportByFilters(
  filters: ProductionOrderFilters,
) {
  const firstPage = await getProductionOrderIdsPageByFilters({
    page: 1,
    pageSize: PRODUCTION_ORDER_FILTER_EXPORT_PAGE_SIZE,
    ...filters,
  })

  const collectedIds = [...firstPage.ids]

  if (firstPage.total <= collectedIds.length) {
    return getProductionOrdersForExport(collectedIds)
  }

  const totalPages = Math.ceil(
    firstPage.total / PRODUCTION_ORDER_FILTER_EXPORT_PAGE_SIZE,
  )
  const remainingPages = Array.from(
    { length: Math.max(totalPages - 1, 0) },
    (_, index) => index + 2,
  )

  for (
    let index = 0;
    index < remainingPages.length;
    index += PRODUCTION_ORDER_FILTER_EXPORT_PAGE_CONCURRENCY
  ) {
    const pageChunk = remainingPages.slice(
      index,
      index + PRODUCTION_ORDER_FILTER_EXPORT_PAGE_CONCURRENCY,
    )
    const pageResults = await Promise.all(
      pageChunk.map((page) =>
        getProductionOrderIdsPageByFilters({
          page,
          pageSize: PRODUCTION_ORDER_FILTER_EXPORT_PAGE_SIZE,
          ...filters,
        }),
      ),
    )

    pageResults.forEach((result) => {
      collectedIds.push(...result.ids)
    })
  }

  return getProductionOrdersForExport(collectedIds)
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

export interface ProductionItemWithOrderDetail {
  id: string
  operation: string
  project_no: string
  product_model: string | null
  length_mm: number | null
  customer_model: string | null
  qualified_quantity: number
  incoming_qualified_quantity: number
  defect_quantity_1: number
  defect_quantity_2: number
  defect_reason_1: string | null
  defect_reason_2: string | null
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  setup_defect_quantity: number
  setup_responsible: string | null
  standard_seconds: number
  remark: string | null
  order_id: string
  order_date: string
  shift: string
  employee_name: string | null
}

export async function getProductionItemsByProjectNo(
  projectNo: string,
): Promise<ProductionItemWithOrderDetail[]> {
  const { data, error } = await supabase
    .from('production_order_items')
    .select(
      `
      *,
      production_orders(
        id,
        order_date,
        shift,
        employee:employees(name)
      )
    `,
    )
    .eq('project_no', projectNo.trim())
    .neq('data_category', 'B')
    .order('operation', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取生产工单明细失败')
  }

  return (
    (data || []) as unknown as Array<{
      id: string
      operation: string
      project_no: string
      product_model: string | null
      length_mm: number | null
      customer_model: string | null
      qualified_quantity: number
      incoming_qualified_quantity: number
      defect_quantity_1: number
      defect_quantity_2: number
      defect_reason_1: string | null
      defect_reason_2: string | null
      outsource_defect_quantity: number
      outsource_defect_reason: string | null
      outsource_unit: string | null
      setup_defect_quantity: number
      setup_responsible: string | null
      standard_seconds: number
      remark: string | null
      order_id: string
      production_orders: {
        id: string
        order_date: string
        shift: string
        employee: { name: string } | null
      } | null
    }>
  ).map((item) => ({
    id: item.id,
    operation: item.operation,
    project_no: item.project_no,
    product_model: item.product_model,
    length_mm: item.length_mm,
    customer_model: item.customer_model,
    qualified_quantity: item.qualified_quantity,
    incoming_qualified_quantity: item.incoming_qualified_quantity,
    defect_quantity_1: item.defect_quantity_1,
    defect_quantity_2: item.defect_quantity_2,
    defect_reason_1: item.defect_reason_1,
    defect_reason_2: item.defect_reason_2,
    outsource_defect_quantity: item.outsource_defect_quantity,
    outsource_defect_reason: item.outsource_defect_reason,
    outsource_unit: item.outsource_unit,
    setup_defect_quantity: item.setup_defect_quantity,
    setup_responsible: item.setup_responsible,
    standard_seconds: item.standard_seconds,
    remark: item.remark,
    order_id: item.order_id,
    order_date: item.production_orders?.order_date ?? '',
    shift: item.production_orders?.shift ?? '',
    employee_name: item.production_orders?.employee?.name ?? null,
  }))
}
