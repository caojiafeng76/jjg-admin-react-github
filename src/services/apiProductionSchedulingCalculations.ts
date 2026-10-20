import type { ProcessStandardCapacityRow, ProductionSchedulingOrder, ProductionSchedulingProcessRow, SchedulingProcessDefinition } from './apiProductionSchedulingTypes'
import type {
  WorkshopOrder,
  WorkshopOrderProcessSchedule,
  WorkshopOrderProcessScheduleStatus,
} from '@/features/workshop/OrderList'
import { calculateDailyStandardCapacity } from '@/utils/costAccounting'
import {

  PRODUCTION_SCHEDULING_PROCESS_OPTIONS,

} from './apiProductionSchedulingTypes'

const PROCESS_CODE_PATTERN = /[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯]/g

const PROCESS_BY_CODE = new Map(
  PRODUCTION_SCHEDULING_PROCESS_OPTIONS.map(item => [item.code, item]),
)

const PROCESS_BY_NAME = new Map(
  PRODUCTION_SCHEDULING_PROCESS_OPTIONS.map(item => [item.name, item]),
)

export function normalizeNullableText(value: unknown) {
  if (typeof value !== 'string') {
    return value == null ? null : String(value)
  }

  const trimmed = value.trim()
  return trimmed || null
}

export function normalizeNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

export function normalizeDateText(value: unknown) {
  return normalizeNullableText(value)
}

export function toQuantity(value: unknown) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export function roundQuantity(value: number) {
  return Math.round(value * 1000) / 1000
}

export function percent(part: number, total: number) {
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
  if (trimmed === '自动切')
    return '切割'
  return trimmed
}

export function normalizeCapacityMatchText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function getOrderProcessNames(order: Pick<WorkshopOrder, 'process_flow'>) {
  return new Set(
    parseSchedulingProcesses(order.process_flow).map(process => process.name),
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

  const definition
    = (processCode ? PROCESS_BY_CODE.get(processCode) : undefined)
      || (processName ? PROCESS_BY_NAME.get(processName) : undefined)

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
    .map(item => normalizeProcessName(item))
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

  return processes.map(process => ({
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
    .filter(schedule => schedule.status === '已排')
    .reduce(
      (total, schedule) => total + toQuantity(schedule.scheduled_quantity),
      0,
    )
}

function getLastScheduledDate(schedules: WorkshopOrderProcessSchedule[]) {
  const scheduledDates = schedules
    .filter(schedule => schedule.status === '已排')
    .map(schedule => schedule.scheduled_date)
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
      schedule =>
        schedule.process_code === process.code
        || normalizeProcessName(schedule.process_name) === process.name,
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
        item => item.id === schedule.id,
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
      schedule => schedule.status !== '已排',
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

export function getOrderScheduleRows(order: WorkshopOrder) {
  const schedules = normalizeProcessSchedules(order.process_schedules)
  return schedules.length > 0 ? reconcileProcessSchedulesWithFlow(order) : []
}

export function getOrderScheduledQuantity(order: WorkshopOrder) {
  const orderQuantity = toQuantity(order.order_quantity)
  const scheduledQuantityByProcess = new Map<string, number>()

  for (const schedule of getOrderScheduleRows(order)) {
    if (schedule.status !== '已排') {
      continue
    }

    const processKey
      = schedule.process_code || normalizeProcessName(schedule.process_name)
    scheduledQuantityByProcess.set(
      processKey,
      (scheduledQuantityByProcess.get(processKey) || 0)
      + toQuantity(schedule.scheduled_quantity),
    )
  }

  const scheduledQuantities = Array.from(scheduledQuantityByProcess.values())
  const scheduledQuantity = scheduledQuantities.length
    ? Math.max(...scheduledQuantities)
    : 0

  return roundQuantity(Math.min(orderQuantity, scheduledQuantity))
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
    row =>
      row.record_type === 'A'
      && normalizeCapacityMatchText(row.model) === model
      && normalizeCapacityMatchText(row.part_no) === partNo
      && isSameLength(row.length, length),
  )
  const matchedRows
    = exactRows.length > 0
      ? exactRows
      : standardRows.filter(
          row =>
            row.record_type === 'B'
            && normalizeCapacityMatchText(row.model) === model,
        )
  const processNames = getOrderProcessNames(order)

  if (processNames.size === 0) {
    return matchedRows
  }

  const processRows = matchedRows.filter(row =>
    processNames.has(normalizeProcessName(row.operation || '')),
  )

  return processRows.length > 0 ? processRows : matchedRows
}

export function getMatchedDailyStandardCapacity({
  order,
  standardRows,
}: {
  order: WorkshopOrder
  standardRows: ProcessStandardCapacityRow[]
}) {
  const capacities = getMatchedCapacityRows({ order, standardRows })
    .map(row => calculateDailyStandardCapacity(row.standard_seconds))
    .filter(capacity => capacity > 0)

  if (capacities.length === 0) {
    return null
  }

  return roundQuantity(Math.min(...capacities))
}

export function getProductionSchedulingProcessRows(
  orders: ProductionSchedulingOrder[],
): ProductionSchedulingProcessRow[] {
  return orders.flatMap(order =>
    getOrderScheduleRows(order).map(schedule => ({
      key: `${order.id || order.project_no}-${schedule.id}`,
      order,
      schedule,
    })),
  )
}
