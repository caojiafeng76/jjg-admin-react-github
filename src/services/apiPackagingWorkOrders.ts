import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface PackagingWorkOrder {
  id: string
  work_date: string
  employee_id: string | null
  employee_name?: string
  project_no: string | null
  product_model: string
  color_name: string | null
  process_name: string | null
  length_mm: number | null
  part_no: string | null
  unit: string
  quantity: number
  standard_seconds: number
  work_hours: number
  extra_qualified_hours: number
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PackagingWorkOrderFormValues {
  work_date: string
  employee_id: string | null
  project_no: string | null
  product_model: string
  color_name: string | null
  process_name: string | null
  length_mm: number | null
  part_no: string | null
  unit: string
  quantity: number
  standard_seconds: number
  extra_qualified_hours?: number
  remark: string | null
}

export interface PackagingWorkOrderSearchParams {
  keyword?: string
  startDate?: string
  endDate?: string
  employeeId?: string
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

const PACKAGING_WORK_ORDER_UNITS = new Set(['支', '千克'])

function packagingWorkOrderTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'packaging_work_orders',
  )
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim() || null
}

function normalizeNumber(value: number | null | undefined) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

function normalizeUnit(value: string | null | undefined) {
  const normalized = String(value ?? '').trim()
  return PACKAGING_WORK_ORDER_UNITS.has(normalized) ? normalized : '支'
}

export function buildPackagingWorkOrderPayload(
  values: PackagingWorkOrderFormValues,
): PackagingWorkOrderFormValues {
  return {
    work_date: String(values.work_date ?? '').trim(),
    employee_id: values.employee_id || null,
    project_no: normalizeText(values.project_no) || null,
    product_model: String(values.product_model ?? '').trim(),
    color_name: normalizeText(values.color_name),
    process_name: normalizeText(values.process_name),
    length_mm: values.length_mm ?? null,
    part_no: normalizeText(values.part_no),
    unit: normalizeUnit(values.unit),
    quantity: normalizeNumber(values.quantity),
    standard_seconds: normalizeNumber(values.standard_seconds),
    extra_qualified_hours: normalizeNumber(values.extra_qualified_hours),
    remark: normalizeText(values.remark),
  }
}

export async function getPackagingWorkOrderList({
  page,
  pageSize,
  searchParams,
}: {
  page: number
  pageSize: number
  searchParams: PackagingWorkOrderSearchParams
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = packagingWorkOrderTable().select(
    `
      *,
      packaging_employees (
        name
      )
    `,
    { count: 'exact' },
  )

  if (searchParams.keyword?.trim()) {
    const normalizedKeyword = searchParams.keyword.trim()
    query = query.or(
      `product_model.ilike.%${normalizedKeyword}%,project_no.ilike.%${normalizedKeyword}%,part_no.ilike.%${normalizedKeyword}%`,
    )
  }

  if (searchParams.startDate) {
    query = query.gte('work_date', searchParams.startDate)
  }

  if (searchParams.endDate) {
    query = query.lte('work_date', searchParams.endDate)
  }

  if (searchParams.employeeId) {
    query = query.eq('employee_id', searchParams.employeeId)
  }

  const { data, error, count } = await query
    .order('work_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取生产工单列表失败')
  }

  const items = (data || []).map((item: any) => ({
    ...item,
    employee_name: item.packaging_employees?.name || null,
  }))

  return {
    items: items as PackagingWorkOrder[],
    total: count || 0,
  }
}

export async function createPackagingWorkOrder(
  values: PackagingWorkOrderFormValues,
) {
  const payload = buildPackagingWorkOrderPayload(values)

  const { error } = await packagingWorkOrderTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建生产工单失败')
  }
}

export async function updatePackagingWorkOrder({
  id,
  values,
}: {
  id: string
  values: PackagingWorkOrderFormValues
}) {
  const payload = buildPackagingWorkOrderPayload(values)

  const { error } = await packagingWorkOrderTable()
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新生产工单失败')
  }
}

export async function deletePackagingWorkOrder(ids: string[]) {
  const { error } = await packagingWorkOrderTable()
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除生产工单失败')
  }
}

export async function getSalesOrderByProjectNo(projectNo: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      'project_no, product_model, color_name, length_mm, material_code',
    )
    .eq('project_no', projectNo)
    .single()

  if (error) {
    throw handleApiError(error, '获取销售订单信息失败')
  }

  if (!data?.project_no) {
    throw new Error('销售订单项目号不存在')
  }

  return data as {
    project_no: string
    product_model: string | null
    color_name: string | null
    length_mm: number | null
    material_code: string | null
  }
}

export async function getStandardSecondsByPartNo(partNo: string | null) {
  if (!partNo) {
    return 0
  }

  const { data, error } = await (supabase as unknown as DynamicSupabaseTable)
    .from('packaging_standard_times')
    .select('standard_seconds')
    .eq('part_no', partNo)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取标准工时失败')
  }

  return (data as { standard_seconds?: number } | null)?.standard_seconds ?? 0
}
