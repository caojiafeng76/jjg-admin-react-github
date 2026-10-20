import type {
  PrecisionFinishingCuttingInsert,
  PrecisionFinishingCuttingUpdate,
} from './types'

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

function normalizeOperatorPayload(
  operatorEmployeeIds: string[],
  operatorNames: string[],
) {
  const normalizedOperatorEmployeeIds = Array.from(
    new Set(operatorEmployeeIds.filter(Boolean)),
  )
  const normalizedOperatorNames = operatorNames
    .map(name => name.trim())
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

export function normalizePrecisionFinishingCuttingInsertPayload(
  values: PrecisionFinishingCuttingInsert,
): PrecisionFinishingCuttingInsert {
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
    ...operatorPayload,
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

export function normalizePrecisionFinishingCuttingUpdatePayload(
  values: PrecisionFinishingCuttingUpdate,
): PrecisionFinishingCuttingUpdate {
  const payload: PrecisionFinishingCuttingUpdate = {
    ...values,
  }

  if (
    values.operator_employee_ids !== undefined
    || values.operator_names !== undefined
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

  if (values.customer_model !== undefined) {
    payload.customer_model = values.customer_model?.trim() || null
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
    payload.outsource_defect_reason = values.outsource_defect_reason?.trim() || null
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

  if (values.recipient_name !== undefined) {
    payload.recipient_name = values.recipient_name.trim()
  }

  if (values.responsible_process !== undefined) {
    payload.responsible_process = values.responsible_process?.trim() || null
  }

  if (values.process_owner !== undefined) {
    payload.process_owner = values.process_owner?.trim() || null
  }

  if (values.inspector_name !== undefined) {
    payload.inspector_name = values.inspector_name?.trim() || null
  }

  if (values.uploaded_by_name !== undefined) {
    payload.uploaded_by_name = values.uploaded_by_name?.trim() || null
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
