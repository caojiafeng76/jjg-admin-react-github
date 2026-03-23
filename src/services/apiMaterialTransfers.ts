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

export type MaterialTransferWorkshop =
  (typeof MATERIAL_TRANSFER_WORKSHOPS)[number]

export type MaterialTransfer =
  Database['public']['Tables']['material_transfers']['Row']

export type MaterialTransferInsert =
  Database['public']['Tables']['material_transfers']['Insert']

export type MaterialTransferUpdate =
  Database['public']['Tables']['material_transfers']['Update']

export interface MaterialTransferWithEmployee extends MaterialTransfer {
  employee?: {
    id: string
    name: string
  } | null
}

export interface MaterialTransferFilters {
  projectNo?: string
  employeeId?: string
  targetWorkshop?: string
  recipientName?: string
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

  return payload
}

export async function getMaterialTransfers({
  page,
  pageSize,
  projectNo,
  employeeId,
  targetWorkshop,
  recipientName,
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

  if (projectNo) {
    query = query.ilike('project_no', `%${projectNo}%`)
  }

  if (employeeId) {
    query = query.eq('operator_employee_id', employeeId)
  }

  if (targetWorkshop) {
    query = query.eq('target_workshop', targetWorkshop)
  }

  if (recipientName) {
    query = query.ilike('recipient_name', `%${recipientName}%`)
  }

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

export async function deleteMaterialTransfers(ids: string[]) {
  const { error } = await supabase
    .from('material_transfers')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除物料转移单失败')
  }
}
