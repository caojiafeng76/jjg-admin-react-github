import dayjs, { type Dayjs } from 'dayjs'

import {
  QUALITY_REWORK_REPAIR_CATEGORIES,
  QUALITY_REWORK_REPAIR_WORKFLOW_STATUSES,
  type QualityReworkRepair,
  type QualityReworkRepairCategory,
  type QualityReworkRepairFormValues,
  type QualityReworkRepairOrderOption,
  type QualityReworkRepairWorkflowStatus,
} from '@/services/apiQualityReworkRepair'

export type WorkflowStageKey =
  'workshop' | 'production' | 'technical' | 'quality' | 'completed'

export interface WorkflowStageConfig {
  key: WorkflowStageKey
  status: QualityReworkRepairWorkflowStatus
  label: string
  actionLabel: string
  modalTitle: string
  okText: string
  submitStatus: QualityReworkRepairWorkflowStatus
}

export interface QualityReworkRepairFormFields {
  document_no?: string
  project_no?: string
  rework_category?: QualityReworkRepairCategory
  product_name?: string
  specification_model?: string
  responsible_unit?: string
  quantity?: number | null
  planned_rework_date?: Dayjs | null
  actual_rework_date?: Dayjs | null
  defect_description?: string
  application_reason?: string
  workshop_applicant?: string
  application_date?: Dayjs | null
  production_review_opinion?: string
  production_reviewer?: string
  production_review_date?: Dayjs | null
  technical_review_opinion?: string
  technical_reviewer?: string
  technical_review_date?: Dayjs | null
  improvement_actions?: string
  improvement_owner?: string
  improvement_date?: Dayjs | null
  verification_result?: string
  quality_verifier?: string
  verification_date?: Dayjs | null
}

export const DEFAULT_WORKFLOW_STATUS: QualityReworkRepairWorkflowStatus =
  'workshop_pending'

export const WORKFLOW_STAGES: WorkflowStageConfig[] = [
  {
    key: 'workshop',
    status: 'workshop_pending',
    label: '车间发起',
    actionLabel: '提交生产部',
    modalTitle: '车间发起返工返修',
    okText: '提交生产部',
    submitStatus: 'production_pending',
  },
  {
    key: 'production',
    status: 'production_pending',
    label: '生产部确认',
    actionLabel: '生产部确认',
    modalTitle: '生产部确认返工返修',
    okText: '确认并提交技术部',
    submitStatus: 'technical_pending',
  },
  {
    key: 'technical',
    status: 'technical_pending',
    label: '技术部确认',
    actionLabel: '技术部确认',
    modalTitle: '技术部确认返工返修',
    okText: '确认并提交质量部',
    submitStatus: 'quality_pending',
  },
  {
    key: 'quality',
    status: 'quality_pending',
    label: '质量部最终确认',
    actionLabel: '质量部最终确认',
    modalTitle: '质量部最终确认返工返修',
    okText: '最终确认完成',
    submitStatus: 'completed',
  },
  {
    key: 'completed',
    status: 'completed',
    label: '已完成',
    actionLabel: '查看/维护',
    modalTitle: '查看/维护返工返修记录',
    okText: '保存',
    submitStatus: 'completed',
  },
]

export const WORKFLOW_STAGE_BY_KEY = WORKFLOW_STAGES.reduce(
  (result, stage) => {
    result[stage.key] = stage
    return result
  },
  {} as Record<WorkflowStageKey, WorkflowStageConfig>,
)

export const WORKFLOW_STAGE_BY_STATUS = WORKFLOW_STAGES.reduce(
  (result, stage) => {
    result[stage.status] = stage
    return result
  },
  {} as Record<QualityReworkRepairWorkflowStatus, WorkflowStageConfig>,
)

export const DEFAULT_FORM_VALUES: QualityReworkRepairFormFields = {
  document_no: '',
  project_no: '',
  rework_category: '进货检验不合格',
  product_name: '',
  specification_model: '',
  responsible_unit: '',
  quantity: null,
  planned_rework_date: dayjs(),
  actual_rework_date: dayjs(),
  defect_description: '',
  application_reason: '',
  workshop_applicant: '',
  application_date: null,
  production_review_opinion: '',
  production_reviewer: '',
  production_review_date: null,
  technical_review_opinion: '',
  technical_reviewer: '',
  technical_review_date: null,
  improvement_actions: '',
  improvement_owner: '',
  improvement_date: null,
  verification_result: '',
  quality_verifier: '',
  verification_date: null,
}

export function parseCategory(
  value: string | null,
): QualityReworkRepairCategory | undefined {
  if (
    QUALITY_REWORK_REPAIR_CATEGORIES.includes(
      value as QualityReworkRepairCategory,
    )
  ) {
    return value as QualityReworkRepairCategory
  }

  return undefined
}

export function parseWorkflowStatus(
  value: string | null,
): QualityReworkRepairWorkflowStatus | undefined {
  if (
    QUALITY_REWORK_REPAIR_WORKFLOW_STATUSES.includes(
      value as QualityReworkRepairWorkflowStatus,
    )
  ) {
    return value as QualityReworkRepairWorkflowStatus
  }

  return undefined
}

export function formatOrderText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value)
}

export function buildSpecificationModel(order: QualityReworkRepairOrderOption) {
  const parts = [
    formatOrderText(order.customer_model),
    order.length_mm ? `${order.length_mm}mm` : '',
  ].filter(Boolean)

  return parts.join(' / ') || formatOrderText(order.product_model)
}

function toDayjs(value: string | null | undefined) {
  return value ? dayjs(value) : null
}

function formatDate(value: Dayjs | null | undefined) {
  return value?.format('YYYY-MM-DD') || ''
}

export function toFormValues(record: QualityReworkRepair) {
  return {
    ...DEFAULT_FORM_VALUES,
    document_no: record.document_no || '',
    project_no: record.project_no || '',
    rework_category: record.rework_category,
    product_name: record.product_name || '',
    specification_model: record.specification_model || '',
    responsible_unit: record.responsible_unit || '',
    quantity: Number(record.quantity),
    planned_rework_date: toDayjs(record.planned_rework_date),
    actual_rework_date: toDayjs(record.actual_rework_date),
    defect_description: record.defect_description || '',
    application_reason: record.application_reason || '',
    workshop_applicant: record.workshop_applicant || '',
    application_date: toDayjs(record.application_date),
    production_review_opinion: record.production_review_opinion || '',
    production_reviewer: record.production_reviewer || '',
    production_review_date: toDayjs(record.production_review_date),
    technical_review_opinion: record.technical_review_opinion || '',
    technical_reviewer: record.technical_reviewer || '',
    technical_review_date: toDayjs(record.technical_review_date),
    improvement_actions: record.improvement_actions || '',
    improvement_owner: record.improvement_owner || '',
    improvement_date: toDayjs(record.improvement_date),
    verification_result: record.verification_result || '',
    quality_verifier: record.quality_verifier || '',
    verification_date: toDayjs(record.verification_date),
  }
}

export function buildPayload(
  values: QualityReworkRepairFormFields,
  workflowStatus: QualityReworkRepairWorkflowStatus,
): QualityReworkRepairFormValues {
  return {
    document_no: values.document_no?.trim() || undefined,
    project_no: values.project_no?.trim() || '',
    rework_category: values.rework_category || '进货检验不合格',
    product_name: values.product_name?.trim() || '',
    specification_model: values.specification_model?.trim() || '',
    responsible_unit: values.responsible_unit?.trim() || '',
    quantity: Number(values.quantity || 0),
    planned_rework_date: formatDate(values.planned_rework_date),
    actual_rework_date: formatDate(values.actual_rework_date),
    defect_description: values.defect_description?.trim() || '',
    application_reason: values.application_reason?.trim() || '',
    workshop_applicant: values.workshop_applicant?.trim() || '',
    application_date: formatDate(values.application_date),
    production_review_opinion: values.production_review_opinion?.trim() || '',
    production_reviewer: values.production_reviewer?.trim() || '',
    production_review_date: formatDate(values.production_review_date),
    technical_review_opinion: values.technical_review_opinion?.trim() || '',
    technical_reviewer: values.technical_reviewer?.trim() || '',
    technical_review_date: formatDate(values.technical_review_date),
    improvement_actions: values.improvement_actions?.trim() || '',
    improvement_owner: values.improvement_owner?.trim() || '',
    improvement_date: formatDate(values.improvement_date),
    verification_result: values.verification_result?.trim() || '',
    quality_verifier: values.quality_verifier?.trim() || '',
    verification_date: formatDate(values.verification_date),
    workflow_status: workflowStatus,
  }
}
