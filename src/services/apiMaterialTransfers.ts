import dayjs from 'dayjs'

import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { Database } from './database.types'

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

export type MaterialTransferWorkshop =
  (typeof MATERIAL_TRANSFER_WORKSHOPS)[number]

type MaterialTransferRow = Database['public']['Tables']['material_transfers']['Row']
type MaterialTransferInsertBase =
  Database['public']['Tables']['material_transfers']['Insert']
type MaterialTransferUpdateBase =
  Database['public']['Tables']['material_transfers']['Update']

export interface MaterialTransferAuditFields {
  is_audited: boolean
  audited_at: string | null
}

export type MaterialTransfer = MaterialTransferRow & MaterialTransferAuditFields

export type MaterialTransferInsert = MaterialTransferInsertBase & {
  is_audited?: boolean
  audited_at?: string | null
}

export type MaterialTransferUpdate = MaterialTransferUpdateBase & {
  is_audited?: boolean
  audited_at?: string | null
}

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
    nextQuery = nextQuery.eq('operator_employee_id', filters.employeeId)
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

function normalizeMaterialTransferInsertPayload(
  values: MaterialTransferInsert,
): MaterialTransferInsert {
  return {
    project_no: values.project_no.trim(),
    product_model: values.product_model?.trim() || null,
    length_mm: values.length_mm ?? null,
    customer_model: values.customer_model?.trim() || null,
    transfer_quantity: normalizeTransferQuantity(values.transfer_quantity),
    operator_employee_id: values.operator_employee_id,
    target_workshop: values.target_workshop,
    recipient_name: values.recipient_name.trim(),
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

  if (values.project_no !== undefined) {
    payload.project_no = values.project_no.trim()
  }

  if (values.product_model !== undefined) {
    payload.product_model = values.product_model?.trim() || null
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
    .select(
      `
      *,
      employee:employees(id, name)
    `,
      { count: 'exact' },
    )
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
    .select(
      `
      *,
      employee:employees(id, name)
    `,
    )
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
    .select(
      `
      *,
      employee:employees(id, name)
    `,
    )
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
    .insert(payload)
    .select(
      `
      *,
      employee:employees(id, name)
    `,
    )
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
    .update(payload)
    .eq('id', id)
    .select(
      `
      *,
      employee:employees(id, name)
    `,
    )
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
    .update(payload)
    .in('id', ids)
    .select(
      `
      *,
      employee:employees(id, name)
    `,
    )

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
