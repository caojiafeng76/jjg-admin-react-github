import type { WorkshopOrder } from '@/features/workshop/OrderList'
import { normalizeWorkshopOrderStatus } from '@/features/workshop/OrderList/orderStatus'
import type { Database } from './database.types'
import supabase from './supabase'
import {
  PRODUCTION_SCHEDULING_MATERIAL_CODE_OR_FILTER,
  isProductionSchedulingMaterialCode,
} from './productionSchedulingMaterialFilter'
import {
  getMatchedDailyStandardCapacity,
  getOrderScheduledQuantity,
  getOrderScheduleRows,
  normalizeCapacityMatchText,
  normalizeDateText,
  normalizeNullableNumber,
  normalizeNullableText,
  normalizeProcessSchedules,
  percent,
  roundQuantity,
  toQuantity,
} from './apiProductionSchedulingCalculations'
import type {
  ProcessStandardCapacityRow,
  ProductionSchedulingFilters,
  ProductionSchedulingOrder,
  ProductionSchedulingOrdersResult,
  ProductionSchedulingOrderUpdate,
} from './apiProductionSchedulingTypes'
import { handleApiError } from '@/utils/errorHandler'
import {
  buildOrIlikeFilter,
  normalizeSearchKeywords,
} from '@/utils/searchKeywords'
import dayjs from 'dayjs'

export * from './apiProductionSchedulingTypes'
export {
  buildInitialProcessSchedules,
  createEmptyProcessSchedule,
  getProductionSchedulingProcessRows,
  normalizeProcessSchedules,
  parseSchedulingProcesses,
  reconcileProcessSchedulesWithFlow,
} from './apiProductionSchedulingCalculations'

const METRIC_PAGE_SIZE = 1000
const PROJECT_NO_CHUNK_SIZE = 300

type SalesOrderUpdatePayload =
  Database['public']['Tables']['sales_orders']['Update'] &
    Record<string, unknown>

type SalesOrderTextField = Extract<
  keyof ProductionSchedulingOrderUpdate,
  | 'delivery_review_result'
  | 'process_flow'
  | 'process_requirement'
  | 'tooling_status'
  | 'bottleneck_processes'
  | 'material_status'
  | 'order_category'
  | 'delivery_priority'
  | 'responsible_person'
  | 'progress_status'
  | 'scheduling_remark'
>

type SalesOrderDateField = Extract<
  keyof ProductionSchedulingOrderUpdate,
  | 'order_date'
  | 'product_delivery_date'
  | 'planned_start_date'
  | 'planned_finish_date'
>

type ProductionQuantityViewRow = Pick<
  Database['public']['Views']['v_production_quantity_by_project']['Row'],
  'project_no' | 'total_qualified_quantity'
>

type TransferSummaryViewRow = Pick<
  Database['public']['Views']['v_material_transfer_summary_by_project']['Row'],
  | 'latest_created_at'
  | 'latest_workshop'
  | 'project_no'
  | 'record_count'
  | 'total_transfer_quantity'
>

interface TransferSummary {
  latestDate: string | null
  latestWorkshop: string | null
  recordCount: number
  totalQuantity: number
}

function chunkValues(values: string[]) {
  const chunks: string[][] = []
  for (let index = 0; index < values.length; index += PROJECT_NO_CHUNK_SIZE) {
    chunks.push(values.slice(index, index + PROJECT_NO_CHUNK_SIZE))
  }
  return chunks
}

async function fetchProductionQuantities(
  projectNos: string[],
  signal?: AbortSignal,
) {
  const quantities = new Map<string, number>()

  for (const projectNoChunk of chunkValues(projectNos)) {
    let query = supabase
      .from('v_production_quantity_by_project')
      .select('project_no, total_qualified_quantity')
      .in('project_no', projectNoChunk)

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) {
      throw handleApiError(error, '获取已加工数量失败')
    }

    for (const row of (data || []) as ProductionQuantityViewRow[]) {
      const projectNo = row.project_no?.trim()
      if (!projectNo) continue
      quantities.set(projectNo, toQuantity(row.total_qualified_quantity))
    }
  }

  return quantities
}

async function fetchTransferSummaries(
  projectNos: string[],
  signal?: AbortSignal,
) {
  const summaries = new Map<string, TransferSummary>()

  for (const projectNoChunk of chunkValues(projectNos)) {
    let query = supabase
      .from('v_material_transfer_summary_by_project')
      .select(
        'project_no, record_count, total_transfer_quantity, latest_created_at, latest_workshop',
      )
      .in('project_no', projectNoChunk)

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) {
      throw handleApiError(error, '获取转移数量失败')
    }

    for (const row of (data || []) as TransferSummaryViewRow[]) {
      const projectNo = row.project_no?.trim()
      if (!projectNo) continue

      summaries.set(projectNo, {
        latestDate: row.latest_created_at ?? null,
        latestWorkshop: row.latest_workshop ?? null,
        recordCount: Number(row.record_count || 0),
        totalQuantity: toQuantity(row.total_transfer_quantity),
      })
    }
  }

  return summaries
}

async function fetchProcessStandardCapacityRows(
  orders: WorkshopOrder[],
  signal?: AbortSignal,
) {
  const rows: ProcessStandardCapacityRow[] = []
  const models = Array.from(
    new Set(
      orders
        .map((order) => normalizeCapacityMatchText(order.product_model))
        .filter(Boolean),
    ),
  )

  if (models.length === 0) {
    return []
  }

  let from = 0

  while (true) {
    const to = from + METRIC_PAGE_SIZE - 1
    let query = supabase
      .from('process_standards')
      .select(
        'record_type, model, length, part_no, operation, standard_seconds',
      )
      .in('model', models)
      .in('record_type', ['A', 'B'])
      .gt('standard_seconds', 0)
      .order('record_type', { ascending: true })
      .order('operation', { ascending: true })
      .range(from, to)

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) {
      throw handleApiError(error, '获取成本核算标准产能失败')
    }

    const pageRows = (data || []) as ProcessStandardCapacityRow[]
    rows.push(...pageRows)

    if (pageRows.length < METRIC_PAGE_SIZE) {
      break
    }

    from += METRIC_PAGE_SIZE
  }

  return rows
}

export async function getProductionSchedulingOrderStandardCapacity({
  order,
  signal,
}: {
  order: WorkshopOrder
  signal?: AbortSignal
}) {
  const standardRows = await fetchProcessStandardCapacityRows([order], signal)
  return getMatchedDailyStandardCapacity({ order, standardRows })
}

/**
 * 从 project_no 中提取订单日期。
 * 约定：前 6 位为 YYMMDD（世纪基准 2000），例如 25052702-01 → 2025-05-27。
 * 长度不足、含非数字或日期越界时返回 null。
 */
function applySchedulingFilters(
  filters: ProductionSchedulingFilters | undefined,
) {
  let query = supabase
    .from('sales_orders')
    .select('*', { count: 'exact' })
    .or(PRODUCTION_SCHEDULING_MATERIAL_CODE_OR_FILTER)
  const projectNoKeywords = normalizeSearchKeywords(filters?.projectNo)
  const materialCodeKeywords = normalizeSearchKeywords(filters?.materialCode)
  const modelKeywords = normalizeSearchKeywords(filters?.model)
  const customer = normalizeNullableText(filters?.customer)
  const lengthMm = (filters?.lengthMm ?? []).filter((value) =>
    Number.isFinite(value),
  )

  if (filters?.status && filters.status !== '全部') {
    query = query.filter(
      'status',
      'eq',
      normalizeWorkshopOrderStatus(filters.status),
    )
  }

  if (projectNoKeywords?.length) {
    query = query.or(buildOrIlikeFilter(['project_no'], projectNoKeywords))
  }

  if (modelKeywords?.length) {
    query = query.or(
      buildOrIlikeFilter(['product_model', 'customer_model'], modelKeywords),
    )
  }

  if (materialCodeKeywords?.length) {
    query = query.or(
      buildOrIlikeFilter(['material_code'], materialCodeKeywords),
    )
  }

  if (customer) {
    query = query.ilike('customer', `%${customer}%`)
  }

  if (lengthMm.length) {
    query = query.in('length_mm', lengthMm)
  }

  if (filters?.plannedStartDateFrom) {
    query = query.gte('planned_start_date', filters.plannedStartDateFrom)
  }

  if (filters?.plannedStartDateTo) {
    query = query.lte('planned_start_date', filters.plannedStartDateTo)
  }

  if (filters?.orderDateFrom || filters?.orderDateTo) {
    // 订单日期筛选用 project_no 前 6 位 YYMMDD 翻译成 SQL 字符串范围：
    // 约定 project_no 前缀为 YYMMDD（世纪基准 2000），例如 25052702-01 → 2025-05-27
    const fromStr = filters.orderDateFrom
      ? dayjs(filters.orderDateFrom).format('YYMMDD')
      : null
    const toNextStr = filters.orderDateTo
      ? dayjs(filters.orderDateTo).add(1, 'day').format('YYMMDD')
      : null
    if (fromStr) {
      query = query.gte('project_no', fromStr)
    }
    if (toNextStr) {
      query = query.lt('project_no', toNextStr)
    }
  }

  // progressStatus 需要基于转移数据动态计算，在查询后过滤
  return query
}

export async function getProductionSchedulingOrders({
  filters,
  page,
  pageSize,
  signal,
}: {
  filters?: ProductionSchedulingFilters
  page: number
  pageSize: number
  signal?: AbortSignal
}): Promise<ProductionSchedulingOrdersResult> {
  const currentPage = Math.max(page, 1)
  const currentPageSize = Math.max(pageSize, 1)
  const from = (currentPage - 1) * currentPageSize
  const to = from + currentPageSize - 1
  let query = applySchedulingFilters(filters)
    .order('order_date', { ascending: false, nullsFirst: false })
    .order('project_no', { ascending: true })
    .range(from, to)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '获取订单排产数据失败')
  }

  const rows = ((data || []) as unknown as WorkshopOrder[]).filter((order) =>
    isProductionSchedulingMaterialCode(order.material_code),
  )

  const projectNos = Array.from(
    new Set(
      rows
        .map((order) => order.project_no?.trim())
        .filter((projectNo): projectNo is string => Boolean(projectNo)),
    ),
  )
  const [productionQuantities, transferSummaries, standardCapacityRows] =
    await Promise.all([
      fetchProductionQuantities(projectNos, signal),
      fetchTransferSummaries(projectNos, signal),
      fetchProcessStandardCapacityRows(rows, signal),
    ])

  const orders = rows
    .map((order) => {
      const projectNo = order.project_no?.trim() || ''
      const orderQuantity = toQuantity(order.order_quantity)
      const processSchedules = getOrderScheduleRows(order)
      const scheduledQuantity = getOrderScheduledQuantity(order)
      const matchedDailyStandardCapacity = getMatchedDailyStandardCapacity({
        order,
        standardRows: standardCapacityRows,
      })
      const remainingScheduleQuantity = Math.max(
        orderQuantity - scheduledQuantity,
        0,
      )
      const processedQuantity = roundQuantity(
        productionQuantities.get(projectNo) || 0,
      )
      const transferSummary = transferSummaries.get(projectNo)
      const transferQuantity = roundQuantity(
        transferSummary?.totalQuantity || 0,
      )

      return {
        ...order,
        capacity_per_day:
          toQuantity(order.capacity_per_day) || matchedDailyStandardCapacity,
        process_schedules: processSchedules,
        total_pending_quantity: orderQuantity,
        scheduled_quantity: scheduledQuantity,
        remaining_schedule_quantity: roundQuantity(remainingScheduleQuantity),
        processed_quantity: processedQuantity,
        transfer_latest_date: transferSummary?.latestDate ?? null,
        transfer_latest_workshop: transferSummary?.latestWorkshop ?? null,
        transfer_quantity: transferQuantity,
        transfer_record_count: transferSummary?.recordCount ?? 0,
        scheduled_rate: percent(scheduledQuantity, orderQuantity),
        remaining_schedule_rate: percent(
          remainingScheduleQuantity,
          orderQuantity,
        ),
        processed_rate: percent(processedQuantity, orderQuantity),
        transfer_rate: percent(transferQuantity, orderQuantity),
      } satisfies ProductionSchedulingOrder
    })
    .filter((order) => {
      if (!filters?.progressStatus) return true

      const status = order.progress_status?.trim()
      const orderQuantity = Number(order.order_quantity || 0)
      const transferQuantity = Number(order.transfer_quantity || 0)

      if (status === '延期') return '延期' === filters.progressStatus
      if (orderQuantity > 0 && transferQuantity >= orderQuantity)
        return '已完工' === filters.progressStatus
      if (transferQuantity > 0) return '进行中' === filters.progressStatus

      const effectiveStatus = status || '未开工'
      return effectiveStatus === filters.progressStatus
    })

  // 仅 progressStatus 是客户端后过滤；订单日期已走 SQL，count 准确
  const effectiveTotal = filters?.progressStatus
    ? orders.length
    : (count ?? orders.length)

  return {
    orders,
    total: effectiveTotal,
  }
}

export async function getProductionSchedulingLengthOptions(
  signal?: AbortSignal,
) {
  const lengths = new Set<number>()
  let from = 0

  while (true) {
    const to = from + METRIC_PAGE_SIZE - 1
    let query = supabase
      .from('sales_orders')
      .select('length_mm')
      .not('length_mm', 'is', null)
      .or(PRODUCTION_SCHEDULING_MATERIAL_CODE_OR_FILTER)
      .order('length_mm', { ascending: true })
      .range(from, to)

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) {
      throw handleApiError(error, '获取订单排产长度选项失败')
    }

    const rows = data || []

    rows.forEach((item) => {
      if (item.length_mm !== null) {
        lengths.add(item.length_mm)
      }
    })

    if (rows.length < METRIC_PAGE_SIZE) {
      break
    }

    from += METRIC_PAGE_SIZE
  }

  return Array.from(lengths).sort((left, right) => left - right)
}

export async function updateProductionSchedulingOrder({
  id,
  values,
}: {
  id: string
  values: ProductionSchedulingOrderUpdate
}) {
  const payload: SalesOrderUpdatePayload = {
    updated_at: new Date().toISOString(),
  }
  const textFields: SalesOrderTextField[] = [
    'delivery_review_result',
    'process_flow',
    'process_requirement',
    'tooling_status',
    'bottleneck_processes',
    'material_status',
    'order_category',
    'delivery_priority',
    'responsible_person',
    'progress_status',
    'scheduling_remark',
  ]
  const dateFields: SalesOrderDateField[] = [
    'order_date',
    'product_delivery_date',
    'planned_start_date',
    'planned_finish_date',
  ]

  for (const field of textFields) {
    if (field in values) {
      payload[field] = normalizeNullableText(values[field])
    }
  }

  for (const field of dateFields) {
    if (field in values) {
      payload[field] = normalizeDateText(values[field])
    }
  }

  if ('capacity_per_day' in values) {
    payload.capacity_per_day = normalizeNullableNumber(values.capacity_per_day)
  }

  if ('progress_percent' in values) {
    payload.progress_percent = normalizeNullableNumber(values.progress_percent)
  }

  if ('responsible_person_ids' in values) {
    ;(payload as Record<string, unknown>).responsible_person_ids =
      values.responsible_person_ids ?? []
  }

  if ('responsible_person_names' in values) {
    ;(payload as Record<string, unknown>).responsible_person_names =
      values.responsible_person_names ?? []
  }

  if ('process_schedules' in values) {
    payload.process_schedules = normalizeProcessSchedules(
      values.process_schedules,
    ) as unknown as Database['public']['Tables']['sales_orders']['Update']['process_schedules']
  }

  const { error } = await supabase
    .from('sales_orders')
    .update(payload as Database['public']['Tables']['sales_orders']['Update'])
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '保存订单排产数据失败')
  }
}
