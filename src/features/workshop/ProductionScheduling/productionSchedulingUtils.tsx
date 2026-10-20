import type {
  ProductionSchedulingFilters,
  ProductionSchedulingOrder,
  ProductionSchedulingOrderUpdate,
} from '@/services/apiProductionScheduling'
import { Typography } from 'antd'

import dayjs from 'dayjs'

const { Text } = Typography

export interface SearchFormValues {
  customer?: string
  lengthMm?: number[]
  materialCode?: string
  model?: string
  projectNo?: string
  status?: ProductionSchedulingFilters['status']
  progressStatus?: string
  plannedStartDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  orderDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
}

export interface SchedulingFormValues {
  planned_finish_date?: dayjs.Dayjs | null
  planned_start_date?: dayjs.Dayjs | null
  product_delivery_date?: dayjs.Dayjs | null
  process_requirement?: string | null
  tooling_status?: string | null
  responsible_person_ids?: string[]
  progress_status?: string | null
  progress_percent?: number | null
  scheduling_remark?: string | null
}

export type ProductionSchedulingSummary = ReturnType<typeof getSummary>

export const DEFAULT_FILTERS: ProductionSchedulingFilters = {
  status: '生产中',
}

export const DEFAULT_PAGE_SIZE = 20

export const PROGRESS_STATUS_OPTIONS = [
  { label: '未开工', value: '未开工' },
  { label: '进行中', value: '进行中' },
  { label: '已完工', value: '已完工' },
  { label: '延期', value: '延期' },
]

export const PROGRESS_STATUS_TAGS: Array<{
  label: string
  value: string | null
}> = [
  { label: '全部', value: null },
  { label: '未开工', value: '未开工' },
  { label: '进行中', value: '进行中' },
  { label: '已完工', value: '已完工' },
  { label: '延期', value: '延期' },
]

export function renderText(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Text type="secondary">-</Text>
  }

  return String(value)
}

export function renderDate(value: string | null | undefined) {
  return value
    ? (
        dayjs(value).format('YYYY-MM-DD')
      )
    : (
        <Text type="secondary">-</Text>
      )
}

export function renderDateTime(value: string | null | undefined) {
  return value
    ? (
        dayjs(value).format('YYYY-MM-DD HH:mm')
      )
    : (
        <Text type="secondary">-</Text>
      )
}

export function renderQuantity(value: number | null | undefined) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : '-'
}

export function renderOrderCode(order: ProductionSchedulingOrder) {
  return order.id ? order.id.slice(0, 8) : '-'
}

function toDatePickerValue(value: string | null | undefined) {
  return value ? dayjs(value) : null
}

function formatDatePickerValue(value: dayjs.Dayjs | null | undefined) {
  return value ? value.format('YYYY-MM-DD') : null
}

export function getProductSpec(order: ProductionSchedulingOrder | null) {
  if (!order) {
    return ''
  }

  return [
    order.product_model,
    order.customer_model,
    order.material_name,
    order.material_code,
    order.length_mm ? `${order.length_mm}mm` : null,
    order.color_name,
  ]
    .map(item => (typeof item === 'string' ? item.trim() : item))
    .filter(Boolean)
    .join(' / ')
}

export function getProgressText(order: ProductionSchedulingOrder) {
  const status = order.progress_status?.trim()
  const orderQuantity = Number(order.order_quantity || 0)
  const transferQuantity = Number(order.transfer_quantity || 0)

  if (status === '延期') {
    return '延期'
  }

  if (orderQuantity > 0 && transferQuantity >= orderQuantity) {
    return '已完工'
  }

  if (transferQuantity > 0) {
    return `进行中（${order.transfer_rate.toFixed(1)}%）`
  }

  return status || '未开工'
}

function getProgressStatus(order: ProductionSchedulingOrder) {
  const progressText = getProgressText(order)

  if (progressText.startsWith('进行中')) {
    return '进行中'
  }

  return progressText
}

function getProgressPercentValue(order: ProductionSchedulingOrder) {
  const transferRate = Number(order.transfer_rate || 0)

  if (transferRate > 0) {
    return Math.min(100, Number(transferRate.toFixed(1)))
  }

  return order.progress_percent ?? null
}

export function getOrderRowKey(order: ProductionSchedulingOrder) {
  return (
    order.id || order.project_no || `${order.customer}-${order.product_model}`
  )
}

/**
 * 从 project_no 中提取订单日期。
 * 约定：前 6 位为 YYMMDD（世纪基准 2000），例如 25052702-01 → 2025-05-27。
 * 长度不足、含非数字或日期越界时返回 null。
 */
export function parseProjectNoDate(
  projectNo: string | null | undefined,
): string | null {
  if (!projectNo)
    return null
  const head = projectNo.replace(/[\s-].*$/, '').slice(0, 6)
  if (!/^\d{6}$/.test(head))
    return null
  const yy = Number(head.slice(0, 2))
  const mm = Number(head.slice(2, 4))
  const dd = Number(head.slice(4, 6))
  const date = dayjs(
    `20${String(yy).padStart(2, '0')}-${mm}-${dd}`,
    'YYYY-M-D',
    true,
  )
  if (!date.isValid())
    return null
  return date.format('YYYY-MM-DD')
}

export function makeSchedulingInitialValues(
  order: ProductionSchedulingOrder,
): SchedulingFormValues {
  return {
    planned_start_date: toDatePickerValue(order.planned_start_date),
    planned_finish_date: toDatePickerValue(order.planned_finish_date),
    product_delivery_date: toDatePickerValue(order.product_delivery_date),
    process_requirement: order.process_requirement ?? null,
    tooling_status: order.tooling_status ?? null,
    responsible_person_ids: order.responsible_person_ids ?? [],
    progress_status: getProgressStatus(order),
    progress_percent: getProgressPercentValue(order),
    scheduling_remark: order.scheduling_remark ?? null,
  }
}

export function formatSchedulingPayload(
  order: ProductionSchedulingOrder,
  values: SchedulingFormValues,
  employeeMap: Map<string, string>,
): ProductionSchedulingOrderUpdate {
  const responsible_person_ids = values.responsible_person_ids ?? []
  const responsible_person_names = responsible_person_ids
    .map(id => employeeMap.get(id))
    .filter((name): name is string => Boolean(name))

  return {
    ...values,
    planned_start_date: formatDatePickerValue(values.planned_start_date),
    planned_finish_date: formatDatePickerValue(values.planned_finish_date),
    product_delivery_date: formatDatePickerValue(values.product_delivery_date),
    progress_percent: getProgressPercentValue(order),
    progress_status: getProgressStatus(order),
    responsible_person_ids,
    responsible_person_names,
  }
}

export function getSummary(orders: ProductionSchedulingOrder[]) {
  return orders.reduce(
    (summary, order) => {
      const progressStatus = getProgressStatus(order)

      return {
        delayedOrders:
          summary.delayedOrders + (progressStatus === '延期' ? 1 : 0),
        finishedOrders:
          summary.finishedOrders + (progressStatus === '已完工' ? 1 : 0),
        inProgressOrders:
          summary.inProgressOrders + (progressStatus === '进行中' ? 1 : 0),
        totalOrders: summary.totalOrders + 1,
        totalQuantity:
          summary.totalQuantity + Number(order.order_quantity || 0),
      }
    },
    {
      delayedOrders: 0,
      finishedOrders: 0,
      inProgressOrders: 0,
      totalOrders: 0,
      totalQuantity: 0,
    },
  )
}
