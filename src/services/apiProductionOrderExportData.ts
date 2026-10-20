import type {
  ProductionOrderExportProgress,
  ProductionOrderFilters,
  ProductionOrderForExport,
} from './apiProductionOrderTypes'
import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

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
      batches.map(batchIds => getProductionOrdersForExportBatch(batchIds)),
    )
  ).flat()
  const rowMap = new Map(rows.map(row => [row.id, row]))

  return sortProductionOrdersForExport(
    uniqueIds
      .map(id => rowMap.get(id))
      .filter((row): row is ProductionOrderForExport => Boolean(row)),
  )
}

const PRODUCTION_ORDER_FILTER_EXPORT_PAGE_SIZE = 1000
const PRODUCTION_ORDER_FILTER_EXPORT_PAGE_CONCURRENCY = 5
export const PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE = 30

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
      item => item.id,
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
  const chunkSize
    = options?.chunkSize ?? PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE
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
  const pageSize
    = options?.pageSize ?? PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE
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
      pageChunk.map(page =>
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
