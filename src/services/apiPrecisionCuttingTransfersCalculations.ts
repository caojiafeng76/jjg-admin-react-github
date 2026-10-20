import type { PrecisionCuttingTransferFilters, PrecisionCuttingTransferInsert, PrecisionCuttingTransferUpdate } from './apiPrecisionCuttingTransfersTypes'

import dayjs from 'dayjs'
import {
  PRECISION_CUTTING_TRANSFER_OPERATORS,

} from './apiPrecisionCuttingTransfersTypes'

const PRECISION_CUTTING_TRANSFER_OPERATOR_SET = new Set<string>(
  PRECISION_CUTTING_TRANSFER_OPERATORS,
)

export function applyPrecisionCuttingTransferFilters<
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

export function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
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

function normalizeOptionalLongMaterialQuantity(
  quantity: number | null | undefined,
  fieldLabel: string,
) {
  if (quantity === null || quantity === undefined) {
    return null
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`${fieldLabel}必须为大于 0 的整数`)
  }

  return quantity
}

function normalizeOperatorNames(operatorNames: string[]) {
  const normalizedOperatorNames = Array.from(
    new Set(operatorNames.map(name => name.trim()).filter(Boolean)),
  )

  if (normalizedOperatorNames.length === 0) {
    throw new Error('请至少选择一名操作人')
  }

  const invalidOperator = normalizedOperatorNames.find(
    name => !PRECISION_CUTTING_TRANSFER_OPERATOR_SET.has(name),
  )

  if (invalidOperator) {
    throw new Error('操作人必须从固定名单中选择')
  }

  return normalizedOperatorNames
}

export function normalizePrecisionCuttingTransferInsertPayload(
  values: PrecisionCuttingTransferInsert,
): PrecisionCuttingTransferInsert {
  const operatorNames = normalizeOperatorNames(values.operator_names)

  return {
    project_no: values.project_no.trim(),
    product_model: values.product_model?.trim() || null,
    length_mm: values.length_mm ?? null,
    customer: values.customer?.trim() || null,
    customer_model: values.customer_model?.trim() || null,
    data_error_responsible: values.data_error_responsible?.trim() || null,
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
    process_card_long_material_quantity: normalizeOptionalLongMaterialQuantity(
      values.process_card_long_material_quantity,
      '流程卡长料数量',
    ),
    erp_long_material_quantity: normalizeOptionalLongMaterialQuantity(
      values.erp_long_material_quantity,
      'ERP长料数量',
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

export function normalizePrecisionCuttingTransferUpdatePayload(
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

  if (values.data_error_responsible !== undefined) {
    payload.data_error_responsible
      = values.data_error_responsible?.trim() || null
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
    payload.outsource_defect_reason
      = values.outsource_defect_reason?.trim() || null
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

  if (values.process_card_long_material_quantity !== undefined) {
    payload.process_card_long_material_quantity
      = normalizeOptionalLongMaterialQuantity(
        values.process_card_long_material_quantity,
        '流程卡长料数量',
      )
  }

  if (values.erp_long_material_quantity !== undefined) {
    payload.erp_long_material_quantity = normalizeOptionalLongMaterialQuantity(
      values.erp_long_material_quantity,
      'ERP长料数量',
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
