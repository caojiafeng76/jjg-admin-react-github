import dayjs from 'dayjs'

import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import {
  buildOrIlikeFilter,
  normalizeSearchKeywords,
} from '@/utils/searchKeywords'

/**
 * 审核状态口径说明：
 *
 * 本项目存在两种审核状态设计，属于有意设计，不可混用：
 *
 * 1. audit_status（三态枚举）— 仅用于 quality_issue_records 表
 *    - 值: 'pending' | 'approved' | 'rejected'
 *    - 语义: 质量问题记录需要"待审核 → 已审核/已驳回"三态流转
 *    - 数据库: CHECK 约束 enforce 允许值
 *    - 特点: 无自动时间戳/操作人同步
 *
 * 2. is_audited（布尔值）— 用于其他所有审核模块
 *    - 值: true（已审核）/ false（待审核）
 *    - 语义: 简单二元审核状态
 *    - 数据库: 有 before-insert-or-update 触发器自动填充 audited_at
 *    - 特点: RLS 策略在 is_audited=true 时锁定记录不可修改
 *
 * 混用两者会导致：
 *  - 数据库 CHECK 约束失败（quality 表不接受布尔值）
 *  - RLS 策略不匹配（布尔模块有自动锁定，质量模块没有）
 *  - UI 审核控件不一致（Switch vs Select）
 */

/**
 * 质量问题类型枚举
 */
export const QUALITY_ISSUE_TYPES = ['尺寸', '表面伤', '表面毛刺'] as const

export type QualityIssueType = (typeof QUALITY_ISSUE_TYPES)[number]

export const QUALITY_ISSUE_AUDIT_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const

export type QualityIssueAuditStatus =
  (typeof QUALITY_ISSUE_AUDIT_STATUSES)[number]

export const QUALITY_ISSUE_AUDIT_STATUS_LABELS: Record<
  QualityIssueAuditStatus,
  string
> = {
  approved: '已审核',
  pending: '待审核',
  rejected: '已驳回',
}

export interface QualityIssueReporter {
  id: string
  name: string
}

export interface QualityIssueRecord {
  audit_status: QualityIssueAuditStatus
  cause: string
  created_at: string
  customer: string | null
  customer_model: string | null
  defective_handling_result: string
  defective_quantity: number
  defect_rate: number
  id: string
  inspector_name: string
  issue_type: QualityIssueType | ''
  length_mm: number | null
  operator?: QualityIssueReporter | QualityIssueReporter[] | null
  operator_employee_id: string | null
  operator_name: string
  order_quantity: number | null
  processed_quantity: number
  product_model: string | null
  production_date: string
  project_no: string
  qualified_quantity: number
  quality_issue: string
  remark: string | null
  reporter?: QualityIssueReporter | QualityIssueReporter[] | null
  reporter_employee_id: string
  responsibility_handling_result: string
  shift_leader_name: string
  updated_at: string
}

export interface QualityIssueRecordFormValues {
  audit_status?: QualityIssueAuditStatus
  cause?: string | null
  customer?: string | null
  customer_model?: string | null
  defective_handling_result?: string | null
  defective_quantity: number
  inspector_name?: string | null
  issue_type?: QualityIssueType | ''
  length_mm?: number | null
  operator_employee_id: string
  operator_name?: string | null
  order_quantity?: number | null
  processed_quantity: number
  product_model?: string | null
  production_date: string
  project_no: string
  qualified_quantity: number
  quality_issue: string
  remark?: string | null
  reporter_employee_id: string
  responsibility_handling_result?: string | null
  shift_leader_name?: string | null
}

export interface QualityIssueRecordSearchParams {
  auditStatus?: QualityIssueAuditStatus
  endDate?: string
  keyword?: string
  operatorEmployeeId?: string
  projectNo?: string
  reporterEmployeeId?: string
  startDate?: string
}

export interface QualityIssueOrderOption {
  customer: string | null
  customer_model: string | null
  length_mm: number | null
  order_quantity: number | null
  product_model: string | null
  project_no: string
}

type QualityIssueRecordPayload = Omit<
  QualityIssueRecordFormValues,
  | 'audit_status'
  | 'cause'
  | 'customer'
  | 'customer_model'
  | 'defective_handling_result'
  | 'inspector_name'
  | 'issue_type'
  | 'length_mm'
  | 'operator_employee_id'
  | 'operator_name'
  | 'order_quantity'
  | 'product_model'
  | 'remark'
  | 'responsibility_handling_result'
  | 'shift_leader_name'
> & {
  audit_status: QualityIssueAuditStatus
  cause: string
  customer: string | null
  customer_model: string | null
  defective_handling_result: string
  inspector_name: string
  issue_type: QualityIssueType | ''
  length_mm: number | null
  operator_employee_id: string
  operator_name: string
  order_quantity: number | null
  product_model: string | null
  remark: string | null
  responsibility_handling_result: string
  shift_leader_name: string
}

type QualityIssueRecordTable = {
  from: (table: string) => any
}

const ORDER_OPTIONS_PAGE_SIZE = 1000
const EXPORT_PAGE_SIZE = 1000

const QUALITY_ISSUE_RECORD_SELECT = `
  *,
  reporter:employees!quality_issue_records_reporter_employee_id_fkey(id, name),
  operator:employees!quality_issue_records_operator_employee_id_fkey(id, name)
`

function qualityIssueRecordTable() {
  return (supabase as unknown as QualityIssueRecordTable).from(
    'quality_issue_records',
  )
}

function trimText(value: string | undefined | null) {
  return value?.trim() || ''
}

function emptyToNull(value: string | undefined | null) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function optionalNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }

  return Number(value)
}

function normalizeNonNegativeInteger(value: number, label: string) {
  const normalized = Number(value)

  if (!Number.isInteger(normalized) || normalized < 0) {
    throw new Error(`${label}必须为大于等于 0 的整数`)
  }

  return normalized
}

function normalizePayload(
  values: QualityIssueRecordFormValues,
): QualityIssueRecordPayload {
  return {
    audit_status: values.audit_status || 'pending',
    cause: trimText(values.cause),
    customer: emptyToNull(values.customer),
    customer_model: emptyToNull(values.customer_model),
    defective_handling_result: trimText(values.defective_handling_result),
    defective_quantity: normalizeNonNegativeInteger(
      values.defective_quantity,
      '不良数量',
    ),
    inspector_name: trimText(values.inspector_name),
    issue_type: values.issue_type || '',
    length_mm: optionalNumber(values.length_mm),
    operator_employee_id: values.operator_employee_id,
    operator_name: trimText(values.operator_name),
    order_quantity: optionalNumber(values.order_quantity),
    processed_quantity: normalizeNonNegativeInteger(
      values.processed_quantity,
      '加工数量',
    ),
    product_model: emptyToNull(values.product_model),
    production_date: values.production_date,
    project_no: trimText(values.project_no),
    qualified_quantity: normalizeNonNegativeInteger(
      values.qualified_quantity,
      '合格数量',
    ),
    quality_issue: trimText(values.quality_issue),
    remark: emptyToNull(values.remark),
    reporter_employee_id: values.reporter_employee_id,
    responsibility_handling_result: trimText(
      values.responsibility_handling_result,
    ),
    shift_leader_name: trimText(values.shift_leader_name),
  }
}

function assertPayloadValid(payload: QualityIssueRecordPayload) {
  if (!payload.production_date) {
    throw new Error('请选择生产日期')
  }

  if (!payload.reporter_employee_id) {
    throw new Error('请选择上报人')
  }

  if (!payload.operator_employee_id) {
    throw new Error('请选择操作人')
  }

  if (!payload.project_no) {
    throw new Error('请选择项目号')
  }

  if (!payload.quality_issue) {
    throw new Error('请输入质量问题')
  }
}

function applyQualityIssueRecordFilters<
  TQuery extends {
    eq: (column: string, value: string) => TQuery
    gte: (column: string, value: string) => TQuery
    lte: (column: string, value: string) => TQuery
    or: (filters: string) => TQuery
  },
>(query: TQuery, filters: QualityIssueRecordSearchParams) {
  let nextQuery = query

  if (filters.startDate) {
    nextQuery = nextQuery.gte('production_date', filters.startDate)
  }

  if (filters.endDate) {
    nextQuery = nextQuery.lte('production_date', filters.endDate)
  }

  const projectNoKeywords = normalizeSearchKeywords(filters.projectNo)
  if (projectNoKeywords?.length) {
    nextQuery = nextQuery.or(
      buildOrIlikeFilter(['project_no'], projectNoKeywords),
    )
  }

  if (filters.reporterEmployeeId) {
    nextQuery = nextQuery.eq('reporter_employee_id', filters.reporterEmployeeId)
  }

  if (filters.operatorEmployeeId) {
    nextQuery = nextQuery.eq('operator_employee_id', filters.operatorEmployeeId)
  }

  if (filters.auditStatus) {
    nextQuery = nextQuery.eq('audit_status', filters.auditStatus)
  }

  const keywords = normalizeSearchKeywords(filters.keyword)
  if (keywords?.length) {
    nextQuery = nextQuery.or(
      buildOrIlikeFilter(
        [
          'project_no',
          'customer',
          'product_model',
          'customer_model',
          'quality_issue',
          'cause',
          'defective_handling_result',
          'responsibility_handling_result',
          'operator_name',
          'shift_leader_name',
          'inspector_name',
          'remark',
        ],
        keywords,
      ),
    )
  }

  return nextQuery
}

export function calculateQualityIssueDefectRate({
  defectiveQuantity,
  processedQuantity,
}: {
  defectiveQuantity?: number | null
  processedQuantity?: number | null
}) {
  const processed = Number(processedQuantity || 0)
  const defective = Number(defectiveQuantity || 0)

  if (processed <= 0) {
    return 0
  }

  return Number(((defective * 100) / processed).toFixed(2))
}

export function getQualityIssueReporterName(record: QualityIssueRecord) {
  const reporter = Array.isArray(record.reporter)
    ? record.reporter[0]
    : record.reporter

  return reporter?.name || '-'
}

export function getQualityIssueOperatorName(record: QualityIssueRecord) {
  const operator = Array.isArray(record.operator)
    ? record.operator[0]
    : record.operator

  return operator?.name || record.operator_name || '-'
}

export async function getQualityIssueRecordList({
  page,
  pageSize,
  ...filters
}: {
  page: number
  pageSize: number
} & QualityIssueRecordSearchParams) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = qualityIssueRecordTable().select(QUALITY_ISSUE_RECORD_SELECT, {
    count: 'exact',
  })

  query = applyQualityIssueRecordFilters(query, filters)

  const { data, error, count } = await query
    .order('production_date', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取质量问题记录列表失败')
  }

  return {
    items: (data || []) as QualityIssueRecord[],
    total: count || 0,
  }
}

export async function getQualityIssueRecordById(id: string) {
  const { data, error } = await qualityIssueRecordTable()
    .select(QUALITY_ISSUE_RECORD_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    throw handleApiError(error, '获取质量问题记录详情失败')
  }

  return data as QualityIssueRecord
}

export async function getQualityIssueRecordOrderOptions() {
  const optionMap = new Map<string, QualityIssueOrderOption>()
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(
        'project_no, customer, product_model, length_mm, customer_model, order_quantity, created_at',
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
        customer: item.customer,
        customer_model: item.customer_model,
        length_mm: item.length_mm,
        order_quantity: item.order_quantity,
        product_model: item.product_model,
        project_no: projectNo,
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

export async function getQualityIssueRecordsForExport(
  filters: QualityIssueRecordSearchParams,
) {
  const rows: QualityIssueRecord[] = []
  let from = 0

  while (true) {
    let query = qualityIssueRecordTable().select(QUALITY_ISSUE_RECORD_SELECT)
    query = applyQualityIssueRecordFilters(query, filters)

    const { data, error } = await query
      .order('production_date', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(from, from + EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取质量问题记录导出数据失败')
    }

    const pageRows = (data || []) as QualityIssueRecord[]
    rows.push(...pageRows)

    if (pageRows.length < EXPORT_PAGE_SIZE) {
      break
    }

    from += EXPORT_PAGE_SIZE
  }

  return rows
}

export async function createQualityIssueRecord(
  values: QualityIssueRecordFormValues,
) {
  const payload = normalizePayload(values)
  assertPayloadValid(payload)

  const { data, error } = await qualityIssueRecordTable()
    .insert(payload)
    .select(QUALITY_ISSUE_RECORD_SELECT)
    .single()

  if (error) {
    throw handleApiError(error, '创建质量问题记录失败')
  }

  return data as QualityIssueRecord
}

export async function updateQualityIssueRecord({
  id,
  values,
}: {
  id: string
  values: QualityIssueRecordFormValues
}) {
  const payload = normalizePayload(values)
  assertPayloadValid(payload)

  const { data, error } = await qualityIssueRecordTable()
    .update(payload)
    .eq('id', id)
    .select(QUALITY_ISSUE_RECORD_SELECT)
    .single()

  if (error) {
    throw handleApiError(error, '更新质量问题记录失败')
  }

  return data as QualityIssueRecord
}

export async function updateQualityIssueRecordAuditStatus({
  auditStatus,
  ids,
}: {
  auditStatus: QualityIssueAuditStatus
  ids: string[]
}) {
  const { error } = await qualityIssueRecordTable()
    .update({ audit_status: auditStatus })
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '批量更新质量问题记录审核状态失败')
  }
}

export async function deleteQualityIssueRecords(ids: string[]) {
  const { error } = await qualityIssueRecordTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除质量问题记录失败')
  }
}

export function normalizeQualityIssueSearchDates(
  startDate?: string,
  endDate?: string,
) {
  return {
    endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : undefined,
    startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : undefined,
  }
}
