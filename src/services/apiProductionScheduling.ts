import type {
  WorkshopOrder,
  WorkshopOrderProcessSchedule,
  WorkshopOrderProcessScheduleStatus,
} from '@/features/workshop/OrderList'
import { normalizeWorkshopOrderStatus } from '@/features/workshop/OrderList/orderStatus'
import type { Database } from './database.types'
import supabase from './supabase'
import {
  PRODUCTION_SCHEDULING_MATERIAL_CODE_OR_FILTER,
  isProductionSchedulingMaterialCode,
} from './productionSchedulingMaterialFilter'
import { handleApiError } from '@/utils/errorHandler'
import { calculateDailyStandardCapacity } from '@/utils/costAccounting'
import {
  buildOrIlikeFilter,
  normalizeSearchKeywords,
} from '@/utils/searchKeywords'
import dayjs from 'dayjs'

const METRIC_PAGE_SIZE = 1000
const PROJECT_NO_CHUNK_SIZE = 300

const PROCESS_CODE_PATTERN = /[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯]/g

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

type ProductionQuantityRow = Pick<
  Database['public']['Tables']['production_order_items']['Row'],
  'project_no' | 'qualified_quantity'
>

type TransferQuantityRow = Pick<
  Database['public']['Tables']['material_transfers']['Row'],
  'created_at' | 'project_no' | 'target_workshop' | 'transfer_quantity'
>

interface TransferSummary {
  latestDate: string | null
  latestWorkshop: string | null
  recordCount: number
  totalQuantity: number
}

type ProcessStandardCapacityRow = Pick<
  Database['public']['Tables']['process_standards']['Row'],
  | 'length'
  | 'model'
  | 'operation'
  | 'part_no'
  | 'record_type'
  | 'standard_seconds'
>

export interface SchedulingProcessDefinition {
  code: string
  name: string
}

export interface ProductionSchedulingFilters {
  customer?: string
  lengthMm?: number[]
  materialCode?: string
  model?: string
  projectNo?: string
  status?: WorkshopOrder['status'] | '全部'
  progressStatus?: string
  plannedStartDateFrom?: string
  plannedStartDateTo?: string
  orderDateFrom?: string
  orderDateTo?: string
}

export interface ProductionSchedulingOrdersResult {
  orders: ProductionSchedulingOrder[]
  total: number
}

export interface ProductionSchedulingOrder extends WorkshopOrder {
  responsible_person?: string | null
  responsible_person_ids?: string[] | null
  responsible_person_names?: string[] | null
  progress_status?: string | null
  progress_percent?: number | null
  processed_quantity: number
  scheduled_quantity: number
  scheduled_rate: number
  total_pending_quantity: number
  transfer_latest_date: string | null
  transfer_latest_workshop: string | null
  transfer_quantity: number
  transfer_record_count: number
  transfer_rate: number
  remaining_schedule_quantity: number
  remaining_schedule_rate: number
  processed_rate: number
}

export interface ProductionSchedulingProcessRow {
  key: string
  order: ProductionSchedulingOrder
  schedule: WorkshopOrderProcessSchedule
}

export interface ProductionSchedulingOrderUpdate {
  order_date?: string | null
  product_delivery_date?: string | null
  planned_start_date?: string | null
  planned_finish_date?: string | null
  delivery_review_result?: string | null
  process_flow?: string | null
  process_requirement?: string | null
  tooling_status?: string | null
  capacity_per_day?: number | null
  bottleneck_processes?: string | null
  material_status?: string | null
  order_category?: string | null
  delivery_priority?: string | null
  responsible_person?: string | null
  responsible_person_ids?: string[] | null
  responsible_person_names?: string[] | null
  progress_status?: string | null
  progress_percent?: number | null
  scheduling_remark?: string | null
  process_schedules?: WorkshopOrderProcessSchedule[] | null
}

export const PRODUCTION_SCHEDULING_PROCESS_OPTIONS: SchedulingProcessDefinition[] =
  [
    { code: '①', name: '精切' },
    { code: '②', name: '切割' },
    { code: '③', name: 'CNC' },
    { code: '④', name: '冲床' },
    { code: '⑤', name: '钻床' },
    { code: '⑥', name: '端铣' },
    { code: '⑦', name: '攻丝' },
    { code: '⑧', name: '滚弯' },
    { code: '⑨', name: '折弯' },
    { code: '⑩', name: '塑封' },
    { code: '⑪', name: '去毛刺' },
    { code: '⑫', name: '预留工序' },
    { code: '⑬', name: '整形' },
    { code: '⑭', name: '检验' },
    { code: '⑮', name: '焊接' },
    { code: '⑯', name: '组装' },
  ]

const PROCESS_BY_CODE = new Map(
  PRODUCTION_SCHEDULING_PROCESS_OPTIONS.map((item) => [item.code, item]),
)

const PROCESS_BY_NAME = new Map(
  PRODUCTION_SCHEDULING_PROCESS_OPTIONS.map((item) => [item.name, item]),
)

function normalizeNullableText(value: unknown) {
  if (typeof value !== 'string') {
    return value == null ? null : String(value)
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function normalizeDateText(value: unknown) {
  return normalizeNullableText(value)
}

function toQuantity(value: unknown) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function roundQuantity(value: number) {
  return Math.round(value * 1000) / 1000
}

function percent(part: number, total: number) {
  if (!total) {
    return 0
  }

  return Math.round((part / total) * 1000) / 10
}

function createScheduleId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeProcessName(name: string) {
  const trimmed = name.trim()
  if (trimmed === '自动切') return '切割'
  return trimmed
}

function normalizeCapacityMatchText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getOrderProcessNames(order: Pick<WorkshopOrder, 'process_flow'>) {
  return new Set(
    parseSchedulingProcesses(order.process_flow).map((process) => process.name),
  )
}

function isSameLength(
  left: number | null | undefined,
  right: number | null | undefined,
) {
  const leftValue = Number(left)
  const rightValue = Number(right)

  if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
    return false
  }

  return Math.abs(leftValue - rightValue) < 0.001
}

function getScheduleStatus(value: unknown): WorkshopOrderProcessScheduleStatus {
  return value === '已排' || value === '余排' ? value : '待排'
}

function normalizeScheduleRecord(
  value: unknown,
  index: number,
): WorkshopOrderProcessSchedule | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const processCode = normalizeNullableText(record.process_code)
  const rawProcessName = normalizeNullableText(record.process_name)
  const processName = rawProcessName
    ? normalizeProcessName(rawProcessName)
    : null

  if (!processCode && !processName) {
    return null
  }

  const definition =
    (processCode ? PROCESS_BY_CODE.get(processCode) : undefined) ||
    (processName ? PROCESS_BY_NAME.get(processName) : undefined)

  return {
    id: String(record.id || createScheduleId()),
    process_code: String(processCode || definition?.code || index + 1),
    process_name: String(processName || definition?.name || processCode || ''),
    status: getScheduleStatus(record.status),
    operator_id: normalizeNullableText(record.operator_id),
    operator_name: normalizeNullableText(record.operator_name),
    required_production_date: normalizeDateText(
      record.required_production_date,
    ),
    scheduled_date: normalizeDateText(record.scheduled_date),
    last_scheduled_date: normalizeDateText(record.last_scheduled_date),
    scheduled_quantity: normalizeNullableNumber(record.scheduled_quantity),
    remark: normalizeNullableText(record.remark),
  }
}

export function normalizeProcessSchedules(
  value: unknown,
): WorkshopOrderProcessSchedule[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item, index) => normalizeScheduleRecord(item, index))
    .filter((item): item is WorkshopOrderProcessSchedule => Boolean(item))
}

export function parseSchedulingProcesses(
  processFlow: string | null | undefined,
): SchedulingProcessDefinition[] {
  const text = processFlow?.trim()
  if (!text) {
    return []
  }

  const seen = new Set<string>()
  const processes: SchedulingProcessDefinition[] = []
  const codeMatches = text.match(PROCESS_CODE_PATTERN) || []

  for (const code of codeMatches) {
    const definition = PROCESS_BY_CODE.get(code) || { code, name: code }
    if (!seen.has(definition.code)) {
      seen.add(definition.code)
      processes.push(definition)
    }
  }

  if (processes.length > 0) {
    return processes
  }

  const tokens = text
    .split(/[\s,，、/／|｜>＞→\-—]+/)
    .map((item) => normalizeProcessName(item))
    .filter(Boolean)

  for (const token of tokens) {
    const definition = PROCESS_BY_NAME.get(token) || {
      code: token,
      name: token,
    }
    if (!seen.has(definition.code)) {
      seen.add(definition.code)
      processes.push(definition)
    }
  }

  return processes
}

export function createEmptyProcessSchedule(
  order?: Pick<WorkshopOrder, 'order_quantity'>,
): WorkshopOrderProcessSchedule {
  return {
    id: createScheduleId(),
    process_code: '',
    process_name: '',
    status: '待排',
    operator_id: null,
    operator_name: null,
    required_production_date: null,
    scheduled_date: null,
    last_scheduled_date: null,
    scheduled_quantity: order?.order_quantity ?? null,
    remark: null,
  }
}

export function buildInitialProcessSchedules(
  order: Pick<WorkshopOrder, 'order_quantity' | 'process_flow'>,
): WorkshopOrderProcessSchedule[] {
  const orderQuantity = toQuantity(order.order_quantity)
  const processes = parseSchedulingProcesses(order.process_flow)

  if (processes.length === 0) {
    return [createEmptyProcessSchedule(order)]
  }

  return processes.map((process) => ({
    id: createScheduleId(),
    process_code: process.code,
    process_name: process.name,
    status: '待排',
    operator_id: null,
    operator_name: null,
    required_production_date: null,
    scheduled_date: null,
    last_scheduled_date: null,
    scheduled_quantity: orderQuantity || null,
    remark: null,
  }))
}

function sumScheduledQuantity(schedules: WorkshopOrderProcessSchedule[]) {
  return schedules
    .filter((schedule) => schedule.status === '已排')
    .reduce(
      (total, schedule) => total + toQuantity(schedule.scheduled_quantity),
      0,
    )
}

function getLastScheduledDate(schedules: WorkshopOrderProcessSchedule[]) {
  const scheduledDates = schedules
    .filter((schedule) => schedule.status === '已排')
    .map((schedule) => schedule.scheduled_date)
    .filter((date): date is string => Boolean(date))

  return scheduledDates.at(-1) ?? null
}

export function reconcileProcessSchedulesWithFlow(
  order: Pick<WorkshopOrder, 'order_quantity' | 'process_flow'> & {
    process_schedules?: WorkshopOrderProcessSchedule[] | null
  },
): WorkshopOrderProcessSchedule[] {
  const schedules = normalizeProcessSchedules(order.process_schedules)
  const processes = parseSchedulingProcesses(order.process_flow)

  if (processes.length === 0) {
    return schedules
  }

  if (schedules.length === 0) {
    return buildInitialProcessSchedules(order)
  }

  const remainingSchedules = [...schedules]
  const orderQuantity = toQuantity(order.order_quantity)
  const reconciledSchedules: WorkshopOrderProcessSchedule[] = []

  for (const process of processes) {
    const matchedSchedules = remainingSchedules.filter(
      (schedule) =>
        schedule.process_code === process.code ||
        normalizeProcessName(schedule.process_name) === process.name,
    )

    if (matchedSchedules.length === 0) {
      reconciledSchedules.push({
        id: createScheduleId(),
        process_code: process.code,
        process_name: process.name,
        status: '待排',
        operator_id: null,
        operator_name: null,
        required_production_date: null,
        scheduled_date: null,
        last_scheduled_date: null,
        scheduled_quantity: orderQuantity || null,
        remark: null,
      })
      continue
    }

    for (const schedule of matchedSchedules) {
      reconciledSchedules.push({
        ...schedule,
        process_code: process.code,
        process_name: process.name,
      })

      const scheduleIndex = remainingSchedules.findIndex(
        (item) => item.id === schedule.id,
      )
      if (scheduleIndex !== -1) {
        remainingSchedules.splice(scheduleIndex, 1)
      }
    }

    const scheduledQuantity = sumScheduledQuantity(matchedSchedules)
    const remainingQuantity = roundQuantity(
      Math.max(orderQuantity - scheduledQuantity, 0),
    )
    const hasPendingOrRemainingSchedule = matchedSchedules.some(
      (schedule) => schedule.status !== '已排',
    )

    if (remainingQuantity > 0 && !hasPendingOrRemainingSchedule) {
      reconciledSchedules.push({
        id: createScheduleId(),
        process_code: process.code,
        process_name: process.name,
        status: scheduledQuantity > 0 ? '余排' : '待排',
        operator_id: null,
        operator_name: null,
        required_production_date: null,
        scheduled_date: null,
        last_scheduled_date: getLastScheduledDate(matchedSchedules),
        scheduled_quantity: remainingQuantity,
        remark: null,
      })
    }
  }

  return reconciledSchedules
}

function getOrderScheduleRows(order: WorkshopOrder) {
  const schedules = normalizeProcessSchedules(order.process_schedules)
  return schedules.length > 0 ? reconcileProcessSchedulesWithFlow(order) : []
}

function getOrderScheduledQuantity(order: WorkshopOrder) {
  const orderQuantity = toQuantity(order.order_quantity)
  const scheduledQuantityByProcess = new Map<string, number>()

  for (const schedule of getOrderScheduleRows(order)) {
    if (schedule.status !== '已排') {
      continue
    }

    const processKey =
      schedule.process_code || normalizeProcessName(schedule.process_name)
    scheduledQuantityByProcess.set(
      processKey,
      (scheduledQuantityByProcess.get(processKey) || 0) +
        toQuantity(schedule.scheduled_quantity),
    )
  }

  const scheduledQuantities = Array.from(scheduledQuantityByProcess.values())
  const scheduledQuantity = scheduledQuantities.length
    ? Math.max(...scheduledQuantities)
    : 0

  return roundQuantity(Math.min(orderQuantity, scheduledQuantity))
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
    let from = 0

    while (true) {
      const to = from + METRIC_PAGE_SIZE - 1
      let query = supabase
        .from('production_order_items')
        .select('project_no, qualified_quantity')
        .in('project_no', projectNoChunk)
        .range(from, to)

      if (signal) {
        query = query.abortSignal(signal)
      }

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取已加工数量失败')
      }

      for (const row of (data || []) as ProductionQuantityRow[]) {
        const projectNo = row.project_no?.trim()
        if (!projectNo) continue
        quantities.set(
          projectNo,
          (quantities.get(projectNo) || 0) + toQuantity(row.qualified_quantity),
        )
      }

      if ((data || []).length < METRIC_PAGE_SIZE) {
        break
      }

      from += METRIC_PAGE_SIZE
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
    let from = 0

    while (true) {
      const to = from + METRIC_PAGE_SIZE - 1
      let query = supabase
        .from('material_transfers')
        .select('project_no, transfer_quantity, target_workshop, created_at')
        .in('project_no', projectNoChunk)
        .range(from, to)

      if (signal) {
        query = query.abortSignal(signal)
      }

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取转移数量失败')
      }

      for (const row of (data || []) as TransferQuantityRow[]) {
        const projectNo = row.project_no?.trim()
        if (!projectNo) continue

        const current = summaries.get(projectNo) ?? {
          latestDate: null,
          latestWorkshop: null,
          recordCount: 0,
          totalQuantity: 0,
        }
        const createdAt = row.created_at || null

        current.recordCount += 1
        current.totalQuantity += toQuantity(row.transfer_quantity)

        if (
          createdAt &&
          (!current.latestDate || createdAt > current.latestDate)
        ) {
          current.latestDate = createdAt
          current.latestWorkshop = row.target_workshop || null
        }

        summaries.set(projectNo, current)
      }

      if ((data || []).length < METRIC_PAGE_SIZE) {
        break
      }

      from += METRIC_PAGE_SIZE
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

function getMatchedCapacityRows({
  order,
  standardRows,
}: {
  order: WorkshopOrder
  standardRows: ProcessStandardCapacityRow[]
}) {
  const model = normalizeCapacityMatchText(order.product_model)
  const partNo = normalizeCapacityMatchText(order.material_code)
  const length = Number(order.length_mm)
  const exactRows = standardRows.filter(
    (row) =>
      row.record_type === 'A' &&
      normalizeCapacityMatchText(row.model) === model &&
      normalizeCapacityMatchText(row.part_no) === partNo &&
      isSameLength(row.length, length),
  )
  const matchedRows =
    exactRows.length > 0
      ? exactRows
      : standardRows.filter(
          (row) =>
            row.record_type === 'B' &&
            normalizeCapacityMatchText(row.model) === model,
        )
  const processNames = getOrderProcessNames(order)

  if (processNames.size === 0) {
    return matchedRows
  }

  const processRows = matchedRows.filter((row) =>
    processNames.has(normalizeProcessName(row.operation || '')),
  )

  return processRows.length > 0 ? processRows : matchedRows
}

function getMatchedDailyStandardCapacity({
  order,
  standardRows,
}: {
  order: WorkshopOrder
  standardRows: ProcessStandardCapacityRow[]
}) {
  const capacities = getMatchedCapacityRows({ order, standardRows })
    .map((row) => calculateDailyStandardCapacity(row.standard_seconds))
    .filter((capacity) => capacity > 0)

  if (capacities.length === 0) {
    return null
  }

  return roundQuantity(Math.min(...capacities))
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

export function getProductionSchedulingProcessRows(
  orders: ProductionSchedulingOrder[],
): ProductionSchedulingProcessRow[] {
  return orders.flatMap((order) =>
    getOrderScheduleRows(order).map((schedule) => ({
      key: `${order.id || order.project_no}-${schedule.id}`,
      order,
      schedule,
    })),
  )
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
