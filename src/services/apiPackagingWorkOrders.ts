import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface PackagingWorkOrder {
  id: string
  input_batch_id?: string | null
  work_date: string
  employee_id: string | null
  employee_name?: string
  employee_hourly_wage?: number | null
  employee_position_salary?: number | null
  project_no: string | null
  product_model: string
  color_name: string | null
  process_name: string | null
  length_mm: number | null
  part_no: string | null
  weight_per_meter_kg: number
  unit: string
  quantity: number
  defective_quantity: number
  total_quantity?: number | null
  total_defective_quantity?: number | null
  defective_weight_kg: number
  defect_reason: string | null
  standard_seconds: number
  work_hours: number
  extra_qualified_hours: number
  remark: string | null
  created_at: string
  updated_at: string
}

export interface PackagingWorkOrderBatch extends PackagingWorkOrder {
  input_batch_id: string
  employee_ids: string[]
  employee_names: string[]
  total_work_hours: number
  is_historical_inconsistent: boolean
}

export interface PackagingWorkOrderFormValues {
  work_date: string
  employee_id?: string | null
  employee_ids?: string[]
  project_no: string | null
  product_model: string
  color_name: string | null
  process_name: string | null
  length_mm: number | null
  part_no: string | null
  weight_per_meter_kg?: number | null
  unit: string
  quantity: number
  defective_quantity?: number | null
  defect_reason?: string | null
  standard_seconds: number
  extra_qualified_hours?: number
  remark: string | null
}

export interface PackagingWorkOrderDetailPayload extends PackagingWorkOrderFormValues {
  input_batch_id?: string
  total_quantity?: number
  total_defective_quantity?: number
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

type DynamicSupabaseRpc = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<any>
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

function normalizeEmployeeIds(values: PackagingWorkOrderFormValues) {
  const ids = values.employee_ids?.filter(Boolean) ?? []
  if (ids.length > 0) return Array.from(new Set(ids))
  return values.employee_id ? [values.employee_id] : []
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10
}

export function buildPackagingWorkOrderPayload(
  values: PackagingWorkOrderFormValues,
): PackagingWorkOrderFormValues {
  const employeeIds = normalizeEmployeeIds(values)

  return {
    work_date: String(values.work_date ?? '').trim(),
    employee_id: employeeIds[0] || null,
    project_no: normalizeText(values.project_no) || null,
    product_model: String(values.product_model ?? '').trim(),
    color_name: normalizeText(values.color_name),
    process_name: normalizeText(values.process_name),
    length_mm: values.length_mm ?? null,
    part_no: normalizeText(values.part_no),
    weight_per_meter_kg: normalizeNumber(values.weight_per_meter_kg),
    unit: normalizeUnit(values.unit),
    quantity: normalizeNumber(values.quantity),
    defective_quantity: normalizeNumber(values.defective_quantity),
    defect_reason: normalizeText(values.defect_reason),
    standard_seconds: normalizeNumber(values.standard_seconds),
    extra_qualified_hours: normalizeNumber(values.extra_qualified_hours),
    remark: normalizeText(values.remark),
  }
}

export function buildPackagingWorkOrderCreatePayloads(
  values: PackagingWorkOrderFormValues,
  inputBatchId?: string,
): PackagingWorkOrderDetailPayload[] {
  const employeeIds = normalizeEmployeeIds(values)
  const basePayload = buildPackagingWorkOrderPayload(values)
  const totalQuantity = basePayload.quantity
  const totalDefectiveQuantity = normalizeNumber(basePayload.defective_quantity)

  if (employeeIds.length === 0) {
    return [
      {
        ...basePayload,
        total_quantity: totalQuantity,
        total_defective_quantity: totalDefectiveQuantity,
      },
    ]
  }

  // 录入总量原样存入 total_* 字段（列表显示以此为准）；
  // 个人明细拆分为简单四舍五入，仅用于导出与工时计算
  // （与 save_packaging_work_order_batch 口径一致）
  const splitQuantity = roundToOneDecimal(totalQuantity / employeeIds.length)
  const splitDefectiveQuantity = roundToOneDecimal(
    totalDefectiveQuantity / employeeIds.length,
  )

  return employeeIds.map((employeeId) => ({
    ...basePayload,
    ...(inputBatchId ? { input_batch_id: inputBatchId } : {}),
    employee_id: employeeId,
    quantity: splitQuantity,
    defective_quantity: splitDefectiveQuantity,
    total_quantity: totalQuantity,
    total_defective_quantity: totalDefectiveQuantity,
  }))
}

function buildPackagingWorkOrderBatchPayload(
  values: PackagingWorkOrderFormValues,
) {
  return {
    ...buildPackagingWorkOrderPayload(values),
    employee_ids: normalizeEmployeeIds(values),
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
  const { data, error } = await (supabase as unknown as DynamicSupabaseRpc).rpc(
    'get_packaging_work_order_batches',
    {
      p_page: page,
      p_page_size: pageSize,
      p_keyword: searchParams.keyword?.trim() || null,
      p_start_date: searchParams.startDate || null,
      p_end_date: searchParams.endDate || null,
      p_employee_id: searchParams.employeeId || null,
    },
  )

  if (error) {
    throw handleApiError(error, '获取生产工单列表失败')
  }

  const items = (data || []).map((item: PackagingWorkOrderBatch) => ({
    ...item,
    employee_name: item.employee_names.join('、'),
  }))

  return {
    items: items as PackagingWorkOrderBatch[],
    total: Number(data?.[0]?.total_count || 0),
  }
}

export async function getAllPackagingWorkOrders({
  searchParams,
}: {
  searchParams: PackagingWorkOrderSearchParams
}) {
  const pageSize = 1000
  const allItems: PackagingWorkOrder[] = []
  let page = 1

  while (true) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    let query = packagingWorkOrderTable().select(
      `*, packaging_employees (name, hourly_wage, position_salary)`,
      { count: 'exact' },
    )

    if (searchParams.keyword?.trim()) {
      const keyword = searchParams.keyword.trim()
      query = query.or(
        `product_model.ilike.%${keyword}%,project_no.ilike.%${keyword}%,part_no.ilike.%${keyword}%`,
      )
    }
    if (searchParams.startDate)
      query = query.gte('work_date', searchParams.startDate)
    if (searchParams.endDate)
      query = query.lte('work_date', searchParams.endDate)
    if (searchParams.employeeId)
      query = query.eq('employee_id', searchParams.employeeId)

    const { data, error, count } = await query
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取生产工单导出数据失败')
    }

    const items = (data || []).map((item: any) => ({
      ...item,
      employee_name: item.packaging_employees?.name || null,
      employee_hourly_wage: item.packaging_employees?.hourly_wage ?? null,
      employee_position_salary:
        item.packaging_employees?.position_salary ?? null,
    })) as PackagingWorkOrder[]

    allItems.push(...items)
    if (items.length === 0 || allItems.length >= (count || 0)) break
    page += 1
  }

  return allItems
}

export async function createPackagingWorkOrder(
  values: PackagingWorkOrderFormValues,
) {
  const { error } = await (supabase as unknown as DynamicSupabaseRpc).rpc(
    'save_packaging_work_order_batch',
    {
      p_input_batch_id: null,
      p_values: buildPackagingWorkOrderBatchPayload(values),
    },
  )

  if (error) {
    throw handleApiError(error, '创建生产工单失败')
  }
}

export async function updatePackagingWorkOrder({
  id,
  values,
  isHistoricalInconsistent = false,
}: {
  id: string
  values: PackagingWorkOrderFormValues
  isHistoricalInconsistent?: boolean
}) {
  if (isHistoricalInconsistent) {
    const payload = buildPackagingWorkOrderPayload(values)
    const { error } = await packagingWorkOrderTable()
      .update({
        ...payload,
        // 历史单人明细行：录入总量即该行数量，保持行内口径一致
        total_quantity: payload.quantity,
        total_defective_quantity: normalizeNumber(payload.defective_quantity),
      })
      .eq('id', id)

    if (error) {
      throw handleApiError(error, '更新生产工单失败')
    }
    return
  }

  const { error } = await (supabase as unknown as DynamicSupabaseRpc).rpc(
    'save_packaging_work_order_batch',
    {
      p_input_batch_id: id,
      p_values: buildPackagingWorkOrderBatchPayload(values),
    },
  )

  if (error) {
    throw handleApiError(error, '更新生产工单失败')
  }
}

export async function deletePackagingWorkOrder({
  batchIds,
  legacyDetailIds,
}: {
  batchIds: string[]
  legacyDetailIds: string[]
}) {
  if (batchIds.length > 0) {
    const { error } = await packagingWorkOrderTable()
      .delete()
      .in('input_batch_id', batchIds)

    if (error) {
      throw handleApiError(error, '删除生产工单失败')
    }
  }

  if (legacyDetailIds.length > 0) {
    const { error } = await packagingWorkOrderTable()
      .delete()
      .in('id', legacyDetailIds)

    if (error) {
      throw handleApiError(error, '删除生产工单失败')
    }
  }
}

export async function getSalesOrderByProjectNo(projectNo: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      'project_no, product_model, color_name, length_mm, material_code, weight_per_meter_kg',
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
    weight_per_meter_kg: number | null
  }
}

export async function getStandardSecondsByPartNo(
  partNo: string | null,
  productModel?: string | null,
) {
  const normalizedPartNo = normalizeText(partNo)
  const normalizedProductModel = normalizeText(productModel)

  if (normalizedPartNo) {
    const { data, error } = await (supabase as unknown as DynamicSupabaseTable)
      .from('packaging_standard_times')
      .select('standard_seconds')
      .eq('part_no', normalizedPartNo)
      .maybeSingle()

    if (error) {
      throw handleApiError(error, '获取标准工时失败')
    }

    const standardSeconds = (data as { standard_seconds?: number } | null)
      ?.standard_seconds

    if (standardSeconds !== undefined && standardSeconds !== null) {
      return standardSeconds
    }
  }

  if (!normalizedProductModel) {
    return 0
  }

  const { data, error } = await (supabase as unknown as DynamicSupabaseTable)
    .from('packaging_standard_times')
    .select('standard_seconds')
    .eq('model', normalizedProductModel)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取标准工时失败')
  }

  return (data as { standard_seconds?: number } | null)?.standard_seconds ?? 0
}
