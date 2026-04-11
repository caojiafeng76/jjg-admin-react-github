import dayjs from 'dayjs'

import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

const PRECISION_FINISHING_CUTTINGS_TABLE = 'precision_finishing_cuttings'

export const PRECISION_FINISHING_CUTTING_WORKSHOPS = [
  '挤压',
  '时效',
  '大氧化',
  '小氧化',
  '精切',
  '精加工',
  '喷涂',
  '抛光',
  '包装',
  '仓库',
] as const

export const PRECISION_FINISHING_CUTTING_AUDIT_OPTIONS = [
  { label: '待审核', value: false },
  { label: '已审核', value: true },
] as const

export const PRECISION_FINISHING_CUTTING_RECIPIENTS = [
  '贾小勇',
  '孟祥军',
  '鲁永祥',
  '胡中康',
  '吴雯雯',
  '王建莉',
  '顾鉴申',
] as const

export type PrecisionFinishingCuttingWorkshop =
  (typeof PRECISION_FINISHING_CUTTING_WORKSHOPS)[number]

export interface PrecisionFinishingCuttingRow {
  audited_at: string | null
  created_at: string
  customer: string | null
  customer_model: string | null
  defect_reason: string | null
  id: string
  inspector_name: string | null
  is_audited: boolean
  length_mm: number | null
  long_material_length_mm: number
  long_material_quantity: number
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  process_owner: string | null
  product_model: string | null
  project_no: string
  processing_defect_count: number
  raw_material_defect_count: number
  recipient_name: string
  remark: string | null
  responsible_process: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at: string
  uploaded_by_name: string | null
}

export interface PrecisionFinishingCuttingInsertBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  defect_reason?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  long_material_length_mm: number
  long_material_quantity: number
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  outsource_defect_quantity?: number
  outsource_defect_reason?: string | null
  outsource_unit?: string | null
  process_owner?: string | null
  product_model?: string | null
  project_no: string
  processing_defect_count: number
  raw_material_defect_count: number
  recipient_name: string
  remark?: string | null
  responsible_process?: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface PrecisionFinishingCuttingUpdateBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  defect_reason?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  long_material_length_mm?: number
  long_material_quantity?: number
  operator_employee_id?: string
  operator_employee_ids?: string[]
  operator_names?: string[]
  outsource_defect_quantity?: number
  outsource_defect_reason?: string | null
  outsource_unit?: string | null
  process_owner?: string | null
  product_model?: string | null
  project_no?: string
  processing_defect_count?: number
  raw_material_defect_count?: number
  recipient_name?: string
  remark?: string | null
  responsible_process?: string | null
  target_workshop?: string
  transfer_quantity?: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface PrecisionFinishingCuttingExtraFields {
  inspector_name: string | null
  uploaded_by_name: string | null
}

export interface PrecisionFinishingCuttingAuditFields {
  is_audited: boolean
  audited_at: string | null
}

export type PrecisionFinishingCutting = PrecisionFinishingCuttingRow &
  PrecisionFinishingCuttingAuditFields &
  PrecisionFinishingCuttingExtraFields

export type PrecisionFinishingCuttingInsert =
  PrecisionFinishingCuttingInsertBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionFinishingCuttingExtraFields>

export type PrecisionFinishingCuttingUpdate =
  PrecisionFinishingCuttingUpdateBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionFinishingCuttingExtraFields>

export interface PrecisionFinishingCuttingWithEmployee
  extends PrecisionFinishingCutting {
  employee?: {
    id: string
    name: string
  } | null
}

export interface PrecisionFinishingCuttingFilters {
  startDate?: string
  endDate?: string
  projectNo?: string
  productModel?: string
  employeeId?: string
  targetWorkshop?: string
  recipientName?: string
  isAudited?: boolean
}

export interface PrecisionFinishingCuttingQuantityStats {
  totalQuantity: number
  totalRecords: number
}

export interface PrecisionFinishingCuttingExportRow
  extends PrecisionFinishingCuttingRow {
  processing_defect_weight_kg: number
  raw_material_defect_weight_kg: number
}

function getPrecisionFinishingCuttingsQuery() {
  return (supabase as any).from(PRECISION_FINISHING_CUTTINGS_TABLE)
}

function applyPrecisionFinishingCuttingFilters<
  TQuery extends {
    ilike: (column: string, pattern: string) => TQuery
    contains: (column: string, value: string[]) => TQuery
    eq: (column: string, value: string | boolean) => TQuery
    gte: (column: string, value: string) => TQuery
    lt: (column: string, value: string) => TQuery
  },
>(query: TQuery, filters: PrecisionFinishingCuttingFilters) {
  let nextQuery = query

  if (filters.startDate) {
    nextQuery = nextQuery.gte(
      'created_at',
      dayjs(filters.startDate).startOf('day').toISOString(),
    )
  }

  if (filters.endDate) {
    nextQuery = nextQuery.lt(
      'created_at',
      dayjs(filters.endDate).add(1, 'day').startOf('day').toISOString(),
    )
  }

  if (filters.projectNo) {
    nextQuery = nextQuery.ilike('project_no', `%${filters.projectNo}%`)
  }

  if (filters.productModel) {
    nextQuery = nextQuery.ilike('product_model', `%${filters.productModel}%`)
  }

  if (filters.employeeId) {
    nextQuery = nextQuery.contains('operator_employee_ids', [filters.employeeId])
  }

  if (filters.targetWorkshop) {
    nextQuery = nextQuery.eq('target_workshop', filters.targetWorkshop)
  }

  if (filters.recipientName) {
    nextQuery = nextQuery.ilike('recipient_name', `%${filters.recipientName}%`)
  }

  if (typeof filters.isAudited === 'boolean') {
    nextQuery = nextQuery.eq('is_audited', filters.isAudited)
  }

  return nextQuery
}

function normalizeTransferQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('转移数量必须为大于 0 的整数')
  }

  return quantity
}

function normalizeDefectCount(quantity: number, fieldLabel: string) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`${fieldLabel}必须为大于等于 0 的整数`)
  }

  return quantity
}

function normalizeLongMaterialLength(length: number) {
  if (!Number.isFinite(length) || length <= 0) {
    throw new Error('长料长度必须大于 0')
  }

  return length
}

function normalizeLongMaterialQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('长料数量必须为大于 0 的整数')
  }

  return quantity
}

function normalizeOperatorPayload(
  operatorEmployeeIds: string[],
  operatorNames: string[],
) {
  const normalizedOperatorEmployeeIds = Array.from(
    new Set(operatorEmployeeIds.filter(Boolean)),
  )
  const normalizedOperatorNames = operatorNames
    .map((name) => name.trim())
    .filter(Boolean)

  if (normalizedOperatorEmployeeIds.length === 0) {
    throw new Error('请至少选择一名操作人')
  }

  if (normalizedOperatorEmployeeIds.length !== normalizedOperatorNames.length) {
    throw new Error('操作人姓名与员工信息不一致，请重新选择')
  }

  return {
    operator_employee_id: normalizedOperatorEmployeeIds[0],
    operator_employee_ids: normalizedOperatorEmployeeIds,
    operator_names: normalizedOperatorNames,
  }
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function getProjectWeightMap(projectNos: string[]) {
  const weightMap = new Map<string, number>()
  const uniqueProjectNos = Array.from(new Set(projectNos.filter(Boolean)))

  for (const chunk of chunkArray(uniqueProjectNos, 1000)) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('project_no, weight_per_meter_kg')
      .in('project_no', chunk)

    if (error) {
      throw handleApiError(error, '获取项目比重失败')
    }

    ;((data || []) as Array<{
      project_no: string | null
      weight_per_meter_kg: number | null
    }>).forEach((item) => {
      if (item.project_no) {
        weightMap.set(item.project_no, Number(item.weight_per_meter_kg || 0))
      }
    })
  }

  return weightMap
}

function normalizePrecisionFinishingCuttingInsertPayload(
  values: PrecisionFinishingCuttingInsert,
): PrecisionFinishingCuttingInsert {
  const operatorPayload = normalizeOperatorPayload(
    values.operator_employee_ids,
    values.operator_names,
  )

  return {
    project_no: values.project_no.trim(),
    product_model: values.product_model?.trim() || null,
    length_mm: values.length_mm ?? null,
    customer: values.customer?.trim() || null,
    customer_model: values.customer_model?.trim() || null,
    raw_material_defect_count: normalizeDefectCount(
      values.raw_material_defect_count,
      '原料不良数',
    ),
    processing_defect_count: normalizeDefectCount(
      values.processing_defect_count,
      '加工不良数',
    ),
    outsource_defect_quantity: normalizeDefectCount(
      values.outsource_defect_quantity ?? 0,
      '外协不良数',
    ),
    defect_reason: values.defect_reason?.trim() || null,
    outsource_defect_reason: values.outsource_defect_reason?.trim() || null,
    outsource_unit: values.outsource_unit?.trim() || null,
    long_material_length_mm: normalizeLongMaterialLength(
      values.long_material_length_mm,
    ),
    long_material_quantity: normalizeLongMaterialQuantity(
      values.long_material_quantity,
    ),
    transfer_quantity: normalizeTransferQuantity(values.transfer_quantity),
    ...operatorPayload,
    target_workshop: values.target_workshop,
    recipient_name: values.recipient_name.trim(),
    responsible_process: values.responsible_process?.trim() || null,
    process_owner: values.process_owner?.trim() || null,
    inspector_name: values.inspector_name?.trim() || null,
    uploaded_by_name: values.uploaded_by_name?.trim() || null,
    remark: values.remark?.trim() || null,
    is_audited: values.is_audited ?? false,
    audited_at: values.audited_at ?? null,
  }
}

function normalizePrecisionFinishingCuttingUpdatePayload(
  values: PrecisionFinishingCuttingUpdate,
): PrecisionFinishingCuttingUpdate {
  const payload: PrecisionFinishingCuttingUpdate = {
    ...values,
  }

  if (
    values.operator_employee_ids !== undefined ||
    values.operator_names !== undefined
  ) {
    if (!values.operator_employee_ids || !values.operator_names) {
      throw new Error('操作人信息不完整，请重新选择')
    }

    Object.assign(
      payload,
      normalizeOperatorPayload(values.operator_employee_ids, values.operator_names),
    )
  }

  if (values.project_no !== undefined) {
    payload.project_no = values.project_no.trim()
  }

  if (values.product_model !== undefined) {
    payload.product_model = values.product_model?.trim() || null
  }

  if (values.customer !== undefined) {
    payload.customer = values.customer?.trim() || null
  }

  if (values.customer_model !== undefined) {
    payload.customer_model = values.customer_model?.trim() || null
  }

  if (values.raw_material_defect_count !== undefined) {
    payload.raw_material_defect_count = normalizeDefectCount(
      values.raw_material_defect_count,
      '原料不良数',
    )
  }

  if (values.processing_defect_count !== undefined) {
    payload.processing_defect_count = normalizeDefectCount(
      values.processing_defect_count,
      '加工不良数',
    )
  }

  if (values.outsource_defect_quantity !== undefined) {
    payload.outsource_defect_quantity = normalizeDefectCount(
      values.outsource_defect_quantity,
      '外协不良数',
    )
  }

  if (values.defect_reason !== undefined) {
    payload.defect_reason = values.defect_reason?.trim() || null
  }

  if (values.outsource_defect_reason !== undefined) {
    payload.outsource_defect_reason = values.outsource_defect_reason?.trim() || null
  }

  if (values.outsource_unit !== undefined) {
    payload.outsource_unit = values.outsource_unit?.trim() || null
  }

  if (values.long_material_length_mm !== undefined) {
    payload.long_material_length_mm = normalizeLongMaterialLength(
      values.long_material_length_mm,
    )
  }

  if (values.long_material_quantity !== undefined) {
    payload.long_material_quantity = normalizeLongMaterialQuantity(
      values.long_material_quantity,
    )
  }

  if (values.recipient_name !== undefined) {
    payload.recipient_name = values.recipient_name.trim()
  }

  if (values.responsible_process !== undefined) {
    payload.responsible_process = values.responsible_process?.trim() || null
  }

  if (values.process_owner !== undefined) {
    payload.process_owner = values.process_owner?.trim() || null
  }

  if (values.inspector_name !== undefined) {
    payload.inspector_name = values.inspector_name?.trim() || null
  }

  if (values.uploaded_by_name !== undefined) {
    payload.uploaded_by_name = values.uploaded_by_name?.trim() || null
  }

  if (values.remark !== undefined) {
    payload.remark = values.remark?.trim() || null
  }

  if (values.transfer_quantity !== undefined) {
    payload.transfer_quantity = normalizeTransferQuantity(
      values.transfer_quantity,
    )
  }

  if (values.is_audited !== undefined) {
    payload.is_audited = values.is_audited
  }

  if (values.audited_at !== undefined) {
    payload.audited_at = values.audited_at
  }

  return payload
}

export async function getPrecisionFinishingCuttings({
  page,
  pageSize,
  ...filters
}: {
  page: number
  pageSize: number
} & PrecisionFinishingCuttingFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = getPrecisionFinishingCuttingsQuery()
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  query = applyPrecisionFinishingCuttingFilters(query, filters)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取精加工切割单列表失败')
  }

  return {
    items: (data || []) as PrecisionFinishingCuttingWithEmployee[],
    total: count || 0,
  }
}

export async function getPrecisionFinishingCuttingById(id: string) {
  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取精加工切割单详情失败')
  }

  return data as PrecisionFinishingCuttingWithEmployee
}

export async function getPrecisionFinishingCuttingsForExport({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionFinishingCuttingFilters
}): Promise<PrecisionFinishingCuttingExportRow[]> {
  if ((!ids || ids.length === 0) && !filters) {
    return []
  }

  let query = getPrecisionFinishingCuttingsQuery()
    .select('*')
    .order('created_at', { ascending: true })

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  } else if (filters) {
    query = applyPrecisionFinishingCuttingFilters(query, filters)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取精加工切割单导出数据失败')
  }

  const rows = (data || []) as PrecisionFinishingCuttingRow[]
  const weightMap = await getProjectWeightMap(rows.map((row) => row.project_no))

  const rowsWithWeight = rows.map((row) => {
    const weightPerMeterKg = weightMap.get(row.project_no) || 0
    const lengthMm = Number(row.length_mm || 0)

    return {
      ...row,
      raw_material_defect_weight_kg: roundTo(
        (Number(row.raw_material_defect_count || 0) * lengthMm * weightPerMeterKg) /
          1000,
      ),
      processing_defect_weight_kg: roundTo(
        (Number(row.processing_defect_count || 0) * lengthMm * weightPerMeterKg) /
          1000,
      ),
    }
  })

  if (!ids || ids.length === 0) {
    return rowsWithWeight
  }

  const rowMap = new Map(rowsWithWeight.map((row) => [row.id, row]))

  return ids
    .map((id) => rowMap.get(id))
    .filter((row): row is PrecisionFinishingCuttingExportRow => Boolean(row))
}

export async function getPrecisionFinishingCuttingQuantityStats({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionFinishingCuttingFilters
} = {}): Promise<PrecisionFinishingCuttingQuantityStats> {
  let query = getPrecisionFinishingCuttingsQuery().select(
    'id, transfer_quantity',
  )

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  } else if (filters) {
    query = applyPrecisionFinishingCuttingFilters(query, filters)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取精加工切割单数量统计失败')
  }

  const rows = (data || []) as Array<{ transfer_quantity: number | null }>

  return {
    totalQuantity: rows.reduce(
      (total: number, row) => total + Number(row.transfer_quantity || 0),
      0,
    ),
    totalRecords: rows.length,
  }
}

export async function createPrecisionFinishingCutting(
  values: PrecisionFinishingCuttingInsert,
) {
  const payload = normalizePrecisionFinishingCuttingInsertPayload(values)

  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .insert(payload as PrecisionFinishingCuttingInsertBase)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '创建精加工切割单失败')
  }

  return data as PrecisionFinishingCuttingWithEmployee
}

export async function updatePrecisionFinishingCutting({
  id,
  values,
}: {
  id: string
  values: PrecisionFinishingCuttingUpdate
}) {
  const payload = normalizePrecisionFinishingCuttingUpdatePayload(values)

  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .update(payload as PrecisionFinishingCuttingUpdateBase)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '更新精加工切割单失败')
  }

  return data as PrecisionFinishingCuttingWithEmployee
}

export async function batchUpdatePrecisionFinishingCuttings({
  ids,
  values,
}: {
  ids: string[]
  values: PrecisionFinishingCuttingUpdate
}) {
  if (ids.length === 0) {
    return [] as PrecisionFinishingCuttingWithEmployee[]
  }

  const payload = normalizePrecisionFinishingCuttingUpdatePayload(values)

  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .update(payload as PrecisionFinishingCuttingUpdateBase)
    .in('id', ids)
    .select('*')

  if (error) {
    throw handleApiError(error, '批量更新精加工切割单失败')
  }

  return (data || []) as PrecisionFinishingCuttingWithEmployee[]
}

export async function deletePrecisionFinishingCuttings(ids: string[]) {
  const { error } = await getPrecisionFinishingCuttingsQuery()
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除精加工切割单失败')
  }
}