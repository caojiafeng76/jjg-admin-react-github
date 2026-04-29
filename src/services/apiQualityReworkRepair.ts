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

const ORDER_OPTIONS_PAGE_SIZE = 1000

export const QUALITY_REWORK_REPAIR_WORKFLOW_STATUSES = [
  'workshop_pending',
  'production_pending',
  'technical_pending',
  'quality_pending',
  'completed',
] as const

export type QualityReworkRepairWorkflowStatus =
  (typeof QUALITY_REWORK_REPAIR_WORKFLOW_STATUSES)[number]

export interface QualityReworkRepair {
  id: string
  document_no: string | null
  project_no: string | null
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
  production_review_opinion: string
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
  workflow_status: QualityReworkRepairWorkflowStatus
  created_at: string
  updated_at: string
}

export interface QualityReworkRepairFormValues {
  document_no?: string
  project_no: string
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
  production_review_opinion: string
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
  workflow_status?: QualityReworkRepairWorkflowStatus
}

export interface QualityReworkRepairSearchParams {
  keyword?: string
  reworkCategory?: QualityReworkRepairCategory
  workflowStatus?: QualityReworkRepairWorkflowStatus
}

export interface QualityReworkRepairOrderOption {
  project_no: string
  product_model: string | null
  length_mm: number | null
  material_code: string | null
  customer: string | null
  customer_model: string | null
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

type QualityReworkRepairRpcClient = {
  rpc: (
    functionName: 'next_quality_rework_repair_document_no',
    args?: { p_document_date?: string | null },
  ) => Promise<{ data: string | null; error: unknown }>
}

function qualityReworkRepairTable() {
  return (supabase as unknown as QualityReworkRepairTable).from(
    'quality_rework_repairs',
  )
}

function qualityReworkRepairRpc() {
  return supabase as unknown as QualityReworkRepairRpcClient
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
    project_no: trimText(values.project_no),
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
    production_review_opinion: trimText(values.production_review_opinion),
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
    workflow_status: values.workflow_status || 'workshop_pending',
  }
}

function assertPayloadValid(payload: QualityReworkRepairPayload) {
  if (!payload.project_no) {
    throw new Error('请选择关联订单项目号')
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
  workflowStatus,
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

  if (workflowStatus) {
    query = query.eq('workflow_status', workflowStatus)
  }

  if (keyword) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `document_no.ilike.%${normalizedKeyword}%,project_no.ilike.%${normalizedKeyword}%,product_name.ilike.%${normalizedKeyword}%,specification_model.ilike.%${normalizedKeyword}%,responsible_unit.ilike.%${normalizedKeyword}%,defect_description.ilike.%${normalizedKeyword}%,application_reason.ilike.%${normalizedKeyword}%,improvement_actions.ilike.%${normalizedKeyword}%,verification_result.ilike.%${normalizedKeyword}%`,
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

export async function getQualityReworkRepairOrderOptions() {
  const optionMap = new Map<string, QualityReworkRepairOrderOption>()
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(
        'project_no, product_model, length_mm, material_code, customer, customer_model',
      )
      .not('project_no', 'is', null)
      .order('created_at', { ascending: false })
      .order('project_no', { ascending: true })
      .range(from, from + ORDER_OPTIONS_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取订单项目号选项失败')
    }

    for (const item of data || []) {
      const projectNo = item.project_no?.trim()

      if (!projectNo || optionMap.has(projectNo)) {
        continue
      }

      optionMap.set(projectNo, {
        project_no: projectNo,
        product_model: item.product_model,
        length_mm: item.length_mm,
        material_code: item.material_code,
        customer: item.customer,
        customer_model: item.customer_model,
      })
    }

    if (!data || data.length < ORDER_OPTIONS_PAGE_SIZE) {
      break
    }

    from += ORDER_OPTIONS_PAGE_SIZE
  }

  return Array.from(optionMap.values()).sort((left, right) =>
    left.project_no.localeCompare(right.project_no),
  )
}

export async function getNextQualityReworkRepairDocumentNo() {
  const { data, error } = await qualityReworkRepairRpc().rpc(
    'next_quality_rework_repair_document_no',
  )

  if (error) {
    throw handleApiError(error, '生成返工返修编号失败')
  }

  if (!data) {
    throw new Error('生成返工返修编号失败')
  }

  return data
}

export async function createQualityReworkRepair(
  values: QualityReworkRepairFormValues,
) {
  const payload = normalizePayload(values)
  assertPayloadValid(payload)

  if (!payload.document_no) {
    payload.document_no = await getNextQualityReworkRepairDocumentNo()
  }

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
  assertPayloadValid(payload)

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
