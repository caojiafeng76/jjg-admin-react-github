import type { Database } from './database.types'
import type { WorkshopOrder } from '@/features/workshop/OrderList'
import { normalizeWorkshopOrderStatus } from '@/features/workshop/OrderList/orderStatus'

type SalesOrderInsert = Database['public']['Tables']['sales_orders']['Insert']
type SalesOrderUpdate = Database['public']['Tables']['sales_orders']['Update']

export function formatBlockedProjectNos(
  projectNos: string[],
  fallbackLabel: string,
) {
  if (projectNos.length === 0) return fallbackLabel
  if (projectNos.length <= 3) return projectNos.join('、')

  return `${projectNos.slice(0, 3).join('、')} 等${projectNos.length}条订单`
}

export function findDuplicateProjectNos(
  projectNos: (string | null)[],
): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  projectNos.forEach((projectNo) => {
    if (!projectNo) return

    if (seen.has(projectNo)) {
      duplicates.add(projectNo)
      return
    }

    seen.add(projectNo)
  })

  return Array.from(duplicates)
}

export function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return value ?? null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeOptionalNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }

  return value
}

function sanitizeStoragePathPart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildSketchPath(row: WorkshopOrder, index: number) {
  const projectNo = sanitizeStoragePathPart(row.project_no || '') || 'unknown'
  const fileName =
    sanitizeStoragePathPart(row.sketch_file?.fileName || '') ||
    `sketch.${row.sketch_file?.extension || 'emf'}`

  return `${projectNo}/${Date.now()}-${index + 1}-${fileName}`
}

export function normalizeWorkshopOrderInput(
  values: WorkshopOrder,
): WorkshopOrder {
  return {
    ...values,
    product_delivery_date: normalizeOptionalText(values.product_delivery_date),
    project_no: normalizeOptionalText(values.project_no),
    product_model: normalizeOptionalText(values.product_model),
    length_mm: normalizeOptionalNumber(values.length_mm),
    length_tolerance: normalizeOptionalText(values.length_tolerance),
    process_flow: normalizeOptionalText(values.process_flow),
    customer: normalizeOptionalText(values.customer),
    customer_model: normalizeOptionalText(values.customer_model),
    order_quantity: normalizeOptionalNumber(values.order_quantity),
    weight_per_meter_kg: normalizeOptionalNumber(values.weight_per_meter_kg),
    color_name: normalizeOptionalText(values.color_name),
    package_name: normalizeOptionalText(values.package_name),
    product_category: normalizeOptionalText(values.product_category),
    material_name: normalizeOptionalText(values.material_name),
    material_code: normalizeOptionalText(values.material_code),
    row_remark: normalizeOptionalText(values.row_remark),
    sketch_file_path: normalizeOptionalText(values.sketch_file_path),
  }
}

function hasMeaningfulWorkshopOrderContent(values: WorkshopOrder) {
  return Boolean(
    values.project_no ||
    values.product_model ||
    values.customer ||
    values.customer_model ||
    values.process_flow ||
    values.material_code ||
    values.length_mm !== null ||
    values.order_quantity !== null ||
    values.weight_per_meter_kg !== null,
  )
}

export function assertWorkshopOrderHasMeaningfulContent(
  values: WorkshopOrder,
  label: string,
) {
  if (hasMeaningfulWorkshopOrderContent(values)) {
    return
  }

  throw new Error(
    `${label}没有任何有效内容，请先填写项目号、产品型号、长度、订支数等信息后再提交`,
  )
}

export function buildSalesOrderPayload(
  values: WorkshopOrder,
  mode: 'create',
): SalesOrderInsert
export function buildSalesOrderPayload(
  values: WorkshopOrder,
  mode: 'update',
): SalesOrderUpdate
export function buildSalesOrderPayload(
  values: WorkshopOrder,
  mode: 'create' | 'update',
): SalesOrderInsert | SalesOrderUpdate {
  const normalizedValues = normalizeWorkshopOrderInput(values)
  const hasClosedAtValue = Object.prototype.hasOwnProperty.call(
    values,
    'closed_at',
  )

  const payload: SalesOrderUpdate = {
    product_delivery_date: normalizedValues.product_delivery_date,
    project_no: normalizedValues.project_no,
    product_model: normalizedValues.product_model,
    length_mm: normalizedValues.length_mm,
    length_tolerance: normalizedValues.length_tolerance,
    process_flow: normalizedValues.process_flow,
    customer: normalizedValues.customer,
    customer_model: normalizedValues.customer_model,
    order_quantity: normalizedValues.order_quantity,
    weight_per_meter_kg: normalizedValues.weight_per_meter_kg,
    color_name: normalizedValues.color_name,
    package_name: normalizedValues.package_name,
    product_category: normalizedValues.product_category,
    material_name: normalizedValues.material_name,
    material_code: normalizedValues.material_code,
    row_remark: normalizedValues.row_remark ?? null,
    sketch_file_path: normalizedValues.sketch_file_path ?? null,
  }

  if (mode === 'create') {
    return {
      ...payload,
      status: normalizeWorkshopOrderStatus(normalizedValues.status),
    }
  }

  if (normalizedValues.status != null) {
    payload.status = normalizeWorkshopOrderStatus(normalizedValues.status)
  } else {
    delete payload.status
  }

  if (mode === 'update' && hasClosedAtValue) {
    payload.closed_at = normalizeOptionalText(values.closed_at)
  }

  return payload
}

export function buildWorkshopOrderStatusUpdateValues(
  status: WorkshopOrder['status'],
  closedAt: Date | string = new Date(),
): SalesOrderUpdate {
  const normalizedStatus = normalizeWorkshopOrderStatus(status)
  const normalizedClosedAt =
    typeof closedAt === 'string' ? closedAt : closedAt.toISOString()

  return {
    status: normalizedStatus,
    closed_at: normalizedStatus === '已结案' ? normalizedClosedAt : null,
  }
}
