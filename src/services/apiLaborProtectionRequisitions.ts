import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface LaborProtectionRequisition {
  id: string
  labor_protection_data_id: string
  category: string
  job_title: string
  quantity: number
  recipient: string
  created_at: string
  updated_at: string
}

export interface LaborProtectionRequisitionFormValues {
  labor_protection_data_id: string
  job_title: string
  quantity: number
  recipient: string
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

type LaborProtectionRequisitionRow = {
  id: string
  labor_protection_data_id: string
  job_title: string
  quantity: number
  recipient: string
  created_at: string
  updated_at: string
  labor_protection_data?:
    | {
        id: string
        category: string
      }
    | Array<{
        id: string
        category: string
      }>
    | null
}

const LABOR_PROTECTION_REQUISITION_SELECT = `
      id,
      labor_protection_data_id,
      job_title,
      quantity,
      recipient,
      created_at,
      updated_at,
      labor_protection_data(id, category)
    `

function laborProtectionRequisitionTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'labor_protection_requisitions',
  )
}

function normalizeRequiredText(value: string, label: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`请输入${label}`)
  }

  return normalized
}

function normalizeQuantity(value: number | string | null | undefined) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('数量必须为大于 0 的整数')
  }

  return parsed
}

function normalizeFormValues(
  values: LaborProtectionRequisitionFormValues,
): LaborProtectionRequisitionFormValues {
  if (!values.labor_protection_data_id) {
    throw new Error('请选择劳保种类')
  }

  return {
    labor_protection_data_id: values.labor_protection_data_id,
    job_title: normalizeRequiredText(values.job_title, '岗位'),
    quantity: normalizeQuantity(values.quantity),
    recipient: normalizeRequiredText(values.recipient, '领取人'),
  }
}

function extractCategory(
  laborProtectionData: LaborProtectionRequisitionRow['labor_protection_data'],
) {
  if (!laborProtectionData) {
    return ''
  }

  if (Array.isArray(laborProtectionData)) {
    return laborProtectionData[0]?.category || ''
  }

  return laborProtectionData.category || ''
}

function mapLaborProtectionRequisition(
  row: LaborProtectionRequisitionRow,
): LaborProtectionRequisition {
  return {
    id: row.id,
    labor_protection_data_id: row.labor_protection_data_id,
    category: extractCategory(row.labor_protection_data),
    job_title: row.job_title,
    quantity: Number(row.quantity || 0),
    recipient: row.recipient,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getLaborProtectionRequisitionList({
  page,
  pageSize,
  keyword,
  categoryId,
}: {
  page: number
  pageSize: number
  keyword?: string
  categoryId?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = laborProtectionRequisitionTable().select(
    LABOR_PROTECTION_REQUISITION_SELECT,
    { count: 'exact' },
  )

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `job_title.ilike.%${normalizedKeyword}%,recipient.ilike.%${normalizedKeyword}%`,
    )
  }

  if (categoryId) {
    query = query.eq('labor_protection_data_id', categoryId)
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取劳保领料单列表失败')
  }

  return {
    items: ((data || []) as LaborProtectionRequisitionRow[]).map(
      mapLaborProtectionRequisition,
    ),
    total: count || 0,
  }
}

export async function createLaborProtectionRequisition(
  values: LaborProtectionRequisitionFormValues,
) {
  const payload = normalizeFormValues(values)

  const { error } = await laborProtectionRequisitionTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建劳保领料单失败')
  }
}

export async function updateLaborProtectionRequisition({
  id,
  values,
}: {
  id: string
  values: LaborProtectionRequisitionFormValues
}) {
  const payload = normalizeFormValues(values)

  const { error } = await laborProtectionRequisitionTable()
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新劳保领料单失败')
  }
}

export async function deleteLaborProtectionRequisition(ids: string[]) {
  const normalizedIds = ids.filter(Boolean)

  if (normalizedIds.length === 0) {
    throw new Error('请选择至少一条劳保领料单数据')
  }

  const { error } = await laborProtectionRequisitionTable()
    .delete()
    .in('id', normalizedIds)

  if (error) {
    throw handleApiError(error, '删除劳保领料单失败')
  }
}
