import dayjs from 'dayjs'

import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export const MATERIAL_TRANSFER_WORKSHOPS = [
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

export const MATERIAL_TRANSFER_AUDIT_OPTIONS = [
  { label: '待审核', value: false },
  { label: '已审核', value: true },
] as const

export const MATERIAL_TRANSFER_RECIPIENTS = [
  '贾小勇',
  '孟祥军',
  '鲁永祥',
  '胡中康',
  '吴雯雯',
  '王建莉',
  '顾鉴申',
] as const

export type MaterialTransferWorkshop =
  (typeof MATERIAL_TRANSFER_WORKSHOPS)[number]

export interface MaterialTransferRow {
  audited_at: string | null
  created_at: string
  customer: string | null
  customer_model: string | null
  id: string
  inspector_name: string | null
  is_audited: boolean
  length_mm: number | null
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  product_model: string | null
  project_no: string
  recipient_name: string
  remark: string | null
  shift_leader_name: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at: string
  uploaded_by_name: string | null
}

export interface MaterialTransferInsertBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  operator_employee_id: string
  operator_employee_ids: string[]
  operator_names: string[]
  product_model?: string | null
  project_no: string
  recipient_name: string
  remark?: string | null
  shift_leader_name?: string | null
  target_workshop: string
  transfer_quantity: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface MaterialTransferUpdateBase {
  audited_at?: string | null
  created_at?: string
  customer?: string | null
  customer_model?: string | null
  id?: string
  inspector_name?: string | null
  is_audited?: boolean
  length_mm?: number | null
  operator_employee_id?: string
  operator_employee_ids?: string[]
  operator_names?: string[]
  product_model?: string | null
  project_no?: string
  recipient_name?: string
  remark?: string | null
  shift_leader_name?: string | null
  target_workshop?: string
  transfer_quantity?: number
  updated_at?: string
  uploaded_by_name?: string | null
}

export interface MaterialTransferExtraFields {
  shift_leader_name: string | null
  inspector_name: string | null
  uploaded_by_name: string | null
}

export interface MaterialTransferAuditFields {
  is_audited: boolean
  audited_at: string | null
}

export type MaterialTransfer = MaterialTransferRow &
  MaterialTransferAuditFields &
  MaterialTransferExtraFields

export type MaterialTransferInsert = MaterialTransferInsertBase & {
  is_audited?: boolean
  audited_at?: string | null
} & Partial<MaterialTransferExtraFields>

export type MaterialTransferUpdate = MaterialTransferUpdateBase & {
  is_audited?: boolean
  audited_at?: string | null
} & Partial<MaterialTransferExtraFields>

export interface MaterialTransferWithEmployee extends MaterialTransfer {
  employee?: {
    id: string
    name: string
  } | null
}

export interface MaterialTransferFilters {
  startDate?: string
  endDate?: string
  projectNo?: string
  productModel?: string
  employeeId?: string
  targetWorkshop?: string
  recipientName?: string
  isAudited?: boolean
}

export interface MaterialTransferQuantityStats {
  totalQuantity: number
  totalRecords: number
}

function applyMaterialTransferFilters<
  TQuery extends {
    ilike: (column: string, pattern: string) => TQuery
    contains: (column: string, value: string[]) => TQuery
    eq: (column: string, value: string | boolean) => TQuery
    gte: (column: string, value: string) => TQuery
    lt: (column: string, value: string) => TQuery
  },
>(query: TQuery, filters: MaterialTransferFilters) {
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

function normalizeMaterialTransferInsertPayload(
  values: MaterialTransferInsert,
): MaterialTransferInsert {
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
    transfer_quantity: normalizeTransferQuantity(values.transfer_quantity),
    ...operatorPayload,
    target_workshop: values.target_workshop,
    recipient_name: values.recipient_name.trim(),
    shift_leader_name: values.shift_leader_name?.trim() || null,
    inspector_name: values.inspector_name?.trim() || null,
    uploaded_by_name: values.uploaded_by_name?.trim() || null,
    remark: values.remark?.trim() || null,
    is_audited: values.is_audited ?? false,
    audited_at: values.audited_at ?? null,
  }
}

function normalizeMaterialTransferUpdatePayload(
  values: MaterialTransferUpdate,
): MaterialTransferUpdate {
  const payload: MaterialTransferUpdate = {
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

  if (values.shift_leader_name !== undefined) {
    payload.shift_leader_name = values.shift_leader_name?.trim() || null
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

export async function getMaterialTransfers({
  page,
  pageSize,
  ...filters
}: {
  page: number
  pageSize: number
} & MaterialTransferFilters) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('material_transfers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  query = applyMaterialTransferFilters(query, filters)

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取物料转移单列表失败')
  }

  return {
    items: (data || []) as unknown as MaterialTransferWithEmployee[],
    total: count || 0,
  }
}

export async function getMaterialTransferById(id: string) {
  const { data, error } = await supabase
    .from('material_transfers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取物料转移单详情失败')
  }

  return data as unknown as MaterialTransferWithEmployee
}

export async function getMaterialTransfersForExport({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: MaterialTransferFilters
}) {
  if ((!ids || ids.length === 0) && !filters) {
    return [] as MaterialTransferWithEmployee[]
  }

  let query = supabase
    .from('material_transfers')
    .select('*')
    .order('created_at', { ascending: true })

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  } else if (filters) {
    query = applyMaterialTransferFilters(query, filters)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取物料转移单导出数据失败')
  }

  const rows = (data || []) as unknown as MaterialTransferWithEmployee[]

  if (!ids || ids.length === 0) {
    return rows
  }

  const rowMap = new Map(rows.map((row) => [row.id, row]))

  return ids
    .map((id) => rowMap.get(id))
    .filter((row): row is MaterialTransferWithEmployee => Boolean(row))
}

export async function getMaterialTransferQuantityStats({
  ids,
  filters,
}: {
  ids?: string[]
  filters?: MaterialTransferFilters
} = {}): Promise<MaterialTransferQuantityStats> {
  let query = supabase
    .from('material_transfers')
    .select('id, transfer_quantity')

  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  } else if (filters) {
    query = applyMaterialTransferFilters(query, filters)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取物料转移单数量统计失败')
  }

  const rows = data || []

  return {
    totalQuantity: rows.reduce(
      (total, row) => total + Number(row.transfer_quantity || 0),
      0,
    ),
    totalRecords: rows.length,
  }
}

export async function createMaterialTransfer(values: MaterialTransferInsert) {
  const payload = normalizeMaterialTransferInsertPayload(values)

  const { data, error } = await supabase
    .from('material_transfers')
    .insert(payload as MaterialTransferInsertBase)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '创建物料转移单失败')
  }

  return data as unknown as MaterialTransferWithEmployee
}

export async function updateMaterialTransfer({
  id,
  values,
}: {
  id: string
  values: MaterialTransferUpdate
}) {
  const payload = normalizeMaterialTransferUpdatePayload(values)

  const { data, error } = await supabase
    .from('material_transfers')
    .update(payload as MaterialTransferUpdateBase)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '更新物料转移单失败')
  }

  return data as unknown as MaterialTransferWithEmployee
}

export async function batchUpdateMaterialTransfers({
  ids,
  values,
}: {
  ids: string[]
  values: MaterialTransferUpdate
}) {
  if (ids.length === 0) {
    return [] as MaterialTransferWithEmployee[]
  }

  const payload = normalizeMaterialTransferUpdatePayload(values)

  const { data, error } = await supabase
    .from('material_transfers')
    .update(payload as MaterialTransferUpdateBase)
    .in('id', ids)
    .select('*')

  if (error) {
    throw handleApiError(error, '批量更新物料转移单失败')
  }

  return (data || []) as unknown as MaterialTransferWithEmployee[]
}

export async function deleteMaterialTransfers(ids: string[]) {
  const { error } = await supabase
    .from('material_transfers')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除物料转移单失败')
  }
}

export interface TransferWorkshopStat {
  target_workshop: string
  total_quantity: number
  record_count: number
}

export interface ProjectTransferStats {
  byWorkshop: TransferWorkshopStat[]
  totalOutbound: number // 入"仓库"的总数
  totalTransferred: number // 所有车间转移总数
}

export async function getTransferStatsByProjectNo(
  projectNo: string,
): Promise<ProjectTransferStats> {
  const { data, error } = await supabase
    .from('material_transfers')
    .select('target_workshop, transfer_quantity')
    .eq('project_no', projectNo.trim())
    .order('target_workshop', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取转移单统计失败')
  }

  const rows = (data || []) as { target_workshop: string; transfer_quantity: number }[]

  const workshopMap = new Map<string, { total: number; count: number }>()
  for (const row of rows) {
    const current = workshopMap.get(row.target_workshop) ?? { total: 0, count: 0 }
    current.total += Number(row.transfer_quantity || 0)
    current.count += 1
    workshopMap.set(row.target_workshop, current)
  }

  const byWorkshop: TransferWorkshopStat[] = Array.from(workshopMap.entries()).map(
    ([workshop, stat]) => ({
      target_workshop: workshop,
      total_quantity: stat.total,
      record_count: stat.count,
    }),
  )

  const totalOutbound =
    workshopMap.get('仓库')?.total ?? 0

  const totalTransferred = rows.reduce(
    (sum, row) => sum + Number(row.transfer_quantity || 0),
    0,
  )

  return { byWorkshop, totalOutbound, totalTransferred }
}
