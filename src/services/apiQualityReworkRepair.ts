import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export const QUALITY_REWORK_REPAIR_CATEGORIES = [
  '进货检验不合格',
  '过程检验不合格',
  '成品检验不合格',
  '顾客退货',
] as const

export type QualityReworkRepairCategory =
  (typeof QUALITY_REWORK_REPAIR_CATEGORIES)[number]

export interface QualityReworkRepair {
  id: string
  document_no: string | null
  rework_category: QualityReworkRepairCategory
  product_name: string
  specification_model: string
  responsible_unit: string
  quantity: number
  planned_rework_date: string | null
  actual_rework_date: string | null
  defect_description: string
  application_reason: string
  workshop_applicant: string
  application_date: string | null
  production_reviewer: string
  production_review_date: string | null
  technical_review_opinion: string
  technical_reviewer: string
  technical_review_date: string | null
  improvement_actions: string
  improvement_owner: string
  improvement_date: string | null
  verification_result: string
  quality_verifier: string
  verification_date: string | null
  created_at: string
  updated_at: string
}

export interface QualityReworkRepairFormValues {
  document_no?: string
  rework_category: QualityReworkRepairCategory
  product_name: string
  specification_model: string
  responsible_unit: string
  quantity: number
  planned_rework_date?: string
  actual_rework_date?: string
  defect_description: string
  application_reason: string
  workshop_applicant: string
  application_date?: string
  production_reviewer: string
  production_review_date?: string
  technical_review_opinion: string
  technical_reviewer: string
  technical_review_date?: string
  improvement_actions: string
  improvement_owner: string
  improvement_date?: string
  verification_result: string
  quality_verifier: string
  verification_date?: string
}

export interface QualityReworkRepairSearchParams {
  keyword?: string
  reworkCategory?: QualityReworkRepairCategory
}

type QualityReworkRepairPayload = Omit<
  QualityReworkRepairFormValues,
  | 'document_no'
  | 'planned_rework_date'
  | 'actual_rework_date'
  | 'application_date'
  | 'production_review_date'
  | 'technical_review_date'
  | 'improvement_date'
  | 'verification_date'
> & {
  document_no: string | null
  planned_rework_date: string | null
  actual_rework_date: string | null
  application_date: string | null
  production_review_date: string | null
  technical_review_date: string | null
  improvement_date: string | null
  verification_date: string | null
}

type QualityReworkRepairTable = {
  from: (table: string) => any
}

function qualityReworkRepairTable() {
  return (supabase as unknown as QualityReworkRepairTable).from(
    'quality_rework_repairs',
  )
}

function trimText(value: string | undefined | null) {
  return value?.trim() || ''
}

function emptyToNull(value: string | undefined | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function normalizePayload(
  values: QualityReworkRepairFormValues,
): QualityReworkRepairPayload {
  return {
    document_no: emptyToNull(values.document_no),
    rework_category: values.rework_category,
    product_name: trimText(values.product_name),
    specification_model: trimText(values.specification_model),
    responsible_unit: trimText(values.responsible_unit),
    quantity: Number(values.quantity || 0),
    planned_rework_date: emptyToNull(values.planned_rework_date),
    actual_rework_date: emptyToNull(values.actual_rework_date),
    defect_description: trimText(values.defect_description),
    application_reason: trimText(values.application_reason),
    workshop_applicant: trimText(values.workshop_applicant),
    application_date: emptyToNull(values.application_date),
    production_reviewer: trimText(values.production_reviewer),
    production_review_date: emptyToNull(values.production_review_date),
    technical_review_opinion: trimText(values.technical_review_opinion),
    technical_reviewer: trimText(values.technical_reviewer),
    technical_review_date: emptyToNull(values.technical_review_date),
    improvement_actions: trimText(values.improvement_actions),
    improvement_owner: trimText(values.improvement_owner),
    improvement_date: emptyToNull(values.improvement_date),
    verification_result: trimText(values.verification_result),
    quality_verifier: trimText(values.quality_verifier),
    verification_date: emptyToNull(values.verification_date),
  }
}

async function checkDocumentNoExists(documentNo: string, excludeId?: string) {
  let query = qualityReworkRepairTable()
    .select('id')
    .eq('document_no', documentNo)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查返工返修编号是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getQualityReworkRepairList({
  page,
  pageSize,
  keyword,
  reworkCategory,
}: {
  page: number
  pageSize: number
} & QualityReworkRepairSearchParams) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = qualityReworkRepairTable().select('*', { count: 'exact' })

  if (reworkCategory) {
    query = query.eq('rework_category', reworkCategory)
  }

  if (keyword) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `document_no.ilike.%${normalizedKeyword}%,product_name.ilike.%${normalizedKeyword}%,specification_model.ilike.%${normalizedKeyword}%,responsible_unit.ilike.%${normalizedKeyword}%,defect_description.ilike.%${normalizedKeyword}%,application_reason.ilike.%${normalizedKeyword}%,improvement_actions.ilike.%${normalizedKeyword}%,verification_result.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('product_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取返工返修列表失败')
  }

  return {
    items: (data || []) as QualityReworkRepair[],
    total: count || 0,
  }
}

export async function createQualityReworkRepair(
  values: QualityReworkRepairFormValues,
) {
  const payload = normalizePayload(values)

  if (payload.document_no) {
    const exists = await checkDocumentNoExists(payload.document_no)
    if (exists) {
      throw new Error(`返工返修编号“${payload.document_no}”已存在，无法创建`)
    }
  }

  const { error } = await qualityReworkRepairTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建返工返修记录失败')
  }
}

export async function updateQualityReworkRepair({
  id,
  values,
}: {
  id: string
  values: QualityReworkRepairFormValues
}) {
  const payload = normalizePayload(values)

  if (payload.document_no) {
    const exists = await checkDocumentNoExists(payload.document_no, id)
    if (exists) {
      throw new Error(`返工返修编号“${payload.document_no}”已存在，无法更新`)
    }
  }

  const { error } = await qualityReworkRepairTable()
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新返工返修记录失败')
  }
}

export async function deleteQualityReworkRepair(ids: string[]) {
  const { error } = await qualityReworkRepairTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除返工返修记录失败')
  }
}
