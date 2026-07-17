import dayjs from 'dayjs'

import supabase from './supabase'
import type { ProductionItemWithOrderDetail } from './apiProductionOrders'
import { handleApiError } from '@/utils/errorHandler'

const PRECISION_CUTTING_TRANSFERS_TABLE = 'precision_cutting_transfers'

export const PRECISION_CUTTING_TRANSFER_WORKSHOPS = [
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

export const PRECISION_CUTTING_TRANSFER_AUDIT_OPTIONS = [
  { label: '待审核', value: false },
  { label: '已审核', value: true },
] as const

export const PRECISION_CUTTING_TRANSFER_RECIPIENTS = [
  '贾小勇',
  '鲁永祥',
  '胡中康',
  '吴雯雯',
  '王建莉',
  '顾鉴申',
] as const

export const PRECISION_CUTTING_TRANSFER_OPERATORS = [
  '吴国忠',
  '蒋建祥',
  '姚利祥',
] as const

export type PrecisionCuttingTransferWorkshop =
  (typeof PRECISION_CUTTING_TRANSFER_WORKSHOPS)[number]

export interface PrecisionCuttingTransferRow {
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

export interface PrecisionCuttingTransferInsertBase {
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

export interface PrecisionCuttingTransferUpdateBase {
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

export interface PrecisionCuttingTransferExtraFields {
  inspector_name: string | null
  uploaded_by_name: string | null
}

export interface PrecisionCuttingTransferAuditFields {
  is_audited: boolean
  audited_at: string | null
}

export type PrecisionCuttingTransfer = PrecisionCuttingTransferRow &
  PrecisionCuttingTransferAuditFields &
  PrecisionCuttingTransferExtraFields

export type PrecisionCuttingTransferInsert =
  PrecisionCuttingTransferInsertBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionCuttingTransferExtraFields>

export type PrecisionCuttingTransferUpdate =
  PrecisionCuttingTransferUpdateBase & {
    is_audited?: boolean
    audited_at?: string | null
  } & Partial<PrecisionCuttingTransferExtraFields>

export interface PrecisionCuttingTransferFilters {
  startDate?: string
  endDate?: string
  projectNo?: string
  productModel?: string
  operatorName?: string
  targetWorkshop?: string
  recipientName?: string
  isAudited?: boolean
}

export interface PrecisionCuttingTransferQuantityStats {
  totalQuantity: number
  totalRecords: number
}

export interface PrecisionCuttingTransferExportRow extends PrecisionCuttingTransferRow {
  processing_defect_weight_kg: number
  raw_material_defect_weight_kg: number
}

const PRECISION_CUTTING_TRANSFER_OPERATOR_SET = new Set<string>(
  PRECISION_CUTTING_TRANSFER_OPERATORS,
)

function getPrecisionCuttingTransfersQuery() {
  return (supabase as any).from(PRECISION_CUTTING_TRANSFERS_TABLE)
}

function applyPrecisionCuttingTransferFilters<
  TQuery extends {
    ilike: (column: string, pattern: string) => TQuery
    contains: (column: string, value: string[]) => TQuery
    eq: (column: string, value: string | boolean) => TQuery
    gte: (column: string, value: string) => TQuery
    lt: (column: string, value: string) => TQuery
  },
>(query: TQuery, filters: PrecisionCuttingTransferFilters) {
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

  if (filters.operatorName) {
    nextQuery = nextQuery.contains('operator_names', [filters.operatorName])
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

    ;(
      (data || []) as Array<{
        project_no: string | null
        weight_per_meter_kg: number | null
      }>
    ).forEach((item) => {
      if (item.project_no) {
        weightMap.set(item.project_no, Number(item.weight_per_meter_kg || 0))
      }
    })
  }

  return weightMap
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

function normalizeOperatorNames(operatorNames: string[]) {
  const normalizedOperatorNames = Array.from(
    new Set(operatorNames.map((name) => name.trim()).filter(Boolean)),
  )

  if (normalizedOperatorNames.length === 0) {
    throw new Error('请至少选择一名操作人')
  }

  const invalidOperator = normalizedOperatorNames.find(
    (name) => !PRECISION_CUTTING_TRANSFER_OPERATOR_SET.has(name),
  )

  if (invalidOperator) {
    throw new Error('操作人必须从固定名单中选择')
  }

  return normalizedOperatorNames
}

function normalizePrecisionCuttingTransferInsertPayload(
  values: PrecisionCuttingTransferInsert,
): PrecisionCuttingTransferInsert {
  const operatorNames = normalizeOperatorNames(values.operator_names)

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
    operator_names: operatorNames,
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

function normalizePrecisionCuttingTransferUpdatePayload(
  values: PrecisionCuttingTransferUpdate,
): PrecisionCuttingTransferUpdate {
  const payload: PrecisionCuttingTransferUpdate = {
    ...values,
  }

  if (values.operator_names !== undefined) {
    payload.operator_names = normalizeOperatorNames(values.operator_names)
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
    payload.outsource_defect_reason =
      values.outsource_defect_reason?.trim() || null
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

  if (values.inspector_name !== undefined) {
    payload.inspector_name = values.inspector_name?.trim() || null
  }

  if (values.uploaded_by_name !== undefined) {
    payload.uploaded_by_name = values.uploaded_by_name?.trim() || null
  }

  if (values.customer_model !== undefined) {
    payload.customer_model = values.customer_model?.trim() || null
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

export async function getPrecisionCuttingTransfers({
  page,
  pageSize,
  ...filters
}: {
  page: number
  pageSize: number
} & PrecisionCuttingTransferFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = getPrecisionCuttingTransfersQuery()
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  query = applyPrecisionCuttingTransferFilters(query, filters)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取精切转移单列表失败')
  }

  return {
    items: (data || []) as PrecisionCuttingTransferRow[],
    total: count || 0,
  }
}

export async function getPrecisionCuttingTransferById(id: string) {
  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取精切转移单详情失败')
  }

  return data as PrecisionCuttingTransferRow
}

export async function getPrecisionCuttingTransferItemsByProjectNo(
  projectNo: string,
): Promise<ProductionItemWithOrderDetail[]> {
  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .select('*')
    .eq('project_no', projectNo.trim())
    .order('created_at', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取精切转移单明细失败')
  }

  return ((data || []) as PrecisionCuttingTransferRow[]).map((item) => {
    const processingDefectCount = Number(item.processing_defect_count || 0)
    const rawMaterialDefectCount = Number(item.raw_material_defect_count || 0)
    const outsourceDefectQuantity = Number(item.outsource_defect_quantity || 0)
    const totalDefect =
      processingDefectCount + rawMaterialDefectCount + outsourceDefectQuantity

    return {
      id: `precision-cutting-transfer:${item.id}`,
      operation: '精切切割',
      project_no: item.project_no,
      product_model: item.product_model,
      length_mm: item.length_mm,
      customer_model: item.customer_model,
      qualified_quantity: Number(item.transfer_quantity || 0),
      incoming_qualified_quantity:
        Number(item.transfer_quantity || 0) + totalDefect,
      defect_quantity_1: processingDefectCount,
      defect_quantity_2: rawMaterialDefectCount,
      defect_reason_1:
        processingDefectCount > 0 ? item.defect_reason?.trim() || '加工' : null,
      defect_reason_2: rawMaterialDefectCount > 0 ? '原料' : null,
      outsource_defect_quantity: outsourceDefectQuantity,
      outsource_defect_reason: item.outsource_defect_reason,
      outsource_unit: item.outsource_unit,
      setup_defect_quantity: 0,
      setup_responsible: null,
      standard_seconds: 0,
      remark: item.remark,
      order_id: item.id,
      order_date: dayjs(item.created_at).format('YYYY-MM-DD'),
      shift: '白班',
      employee_name: item.operator_names.filter(Boolean).join('、') || null,
    }
  })
}

export async function getPrecisionCuttingTransfersForExport({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionCuttingTransferFilters
}): Promise<PrecisionCuttingTransferExportRow[]> {
  if ((!ids || ids.length === 0) && !filters) {
    return []
  }

  let query = getPrecisionCuttingTransfersQuery()
    .select('*')
    .order('created_at', { ascending: true })

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  } else if (filters) {
    query = applyPrecisionCuttingTransferFilters(query, filters)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取精切转移单导出数据失败')
  }

  const rows = (data || []) as PrecisionCuttingTransferRow[]

  const weightMap = await getProjectWeightMap(rows.map((row) => row.project_no))

  const rowsWithWeight = rows.map((row) => {
    const weightPerMeterKg = weightMap.get(row.project_no) || 0
    const lengthMm = Number(row.length_mm || 0)

    return {
      ...row,
      raw_material_defect_weight_kg: roundTo(
        (Number(row.raw_material_defect_count || 0) *
          lengthMm *
          weightPerMeterKg) /
          1000,
      ),
      processing_defect_weight_kg: roundTo(
        (Number(row.processing_defect_count || 0) *
          lengthMm *
          weightPerMeterKg) /
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
    .filter((row): row is PrecisionCuttingTransferExportRow => Boolean(row))
}

export async function getPrecisionCuttingTransferQuantityStats({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: PrecisionCuttingTransferFilters
} = {}): Promise<PrecisionCuttingTransferQuantityStats> {
  let query = getPrecisionCuttingTransfersQuery().select(
    'id, transfer_quantity',
  )

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  } else if (filters) {
    query = applyPrecisionCuttingTransferFilters(query, filters)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取精切转移单数量统计失败')
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

export async function createPrecisionCuttingTransfer(
  values: PrecisionCuttingTransferInsert,
) {
  const payload = normalizePrecisionCuttingTransferInsertPayload(values)

  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .insert(payload as PrecisionCuttingTransferInsertBase)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '创建精切转移单失败')
  }

  return data as PrecisionCuttingTransferRow
}

export async function updatePrecisionCuttingTransfer({
  id,
  values,
}: {
  id: string
  values: PrecisionCuttingTransferUpdate
}) {
  const payload = normalizePrecisionCuttingTransferUpdatePayload(values)

  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .update(payload as PrecisionCuttingTransferUpdateBase)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '更新精切转移单失败')
  }

  return data as PrecisionCuttingTransferRow
}

export async function batchUpdatePrecisionCuttingTransfers({
  ids,
  values,
}: {
  ids: string[]
  values: PrecisionCuttingTransferUpdate
}) {
  if (ids.length === 0) {
    return [] as PrecisionCuttingTransferRow[]
  }

  const payload = normalizePrecisionCuttingTransferUpdatePayload(values)

  const { data, error } = await getPrecisionCuttingTransfersQuery()
    .update(payload as PrecisionCuttingTransferUpdateBase)
    .in('id', ids)
    .select('*')

  if (error) {
    throw handleApiError(error, '批量更新精切转移单失败')
  }

  return (data || []) as PrecisionCuttingTransferRow[]
}

export async function deletePrecisionCuttingTransfers(ids: string[]) {
  const { error } = await getPrecisionCuttingTransfersQuery()
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除精切转移单失败')
  }
}
