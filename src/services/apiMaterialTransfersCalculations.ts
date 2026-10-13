import dayjs from 'dayjs'

import {
  buildOrIlikeFilter,
  normalizeSearchKeywords,
} from '@/utils/searchKeywords'
import type {
  MaterialTransferFilters,
  MaterialTransferInsert,
  MaterialTransferOrderProgress,
  MaterialTransferUpdate,
} from './apiMaterialTransfersTypes'

export function applyMaterialTransferFilters<
  TQuery extends {
    ilike: (column: string, pattern: string) => TQuery
    or: (filters: string) => TQuery
    in: (column: string, value: (string | number)[]) => TQuery
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

  const projectNoKeywords = normalizeSearchKeywords(filters.projectNo)
  if (projectNoKeywords?.length) {
    nextQuery = nextQuery.or(
      buildOrIlikeFilter(['project_no'], projectNoKeywords),
    )
  }

  const productModelKeywords = normalizeSearchKeywords(filters.productModel)

  if (productModelKeywords?.length) {
    nextQuery = nextQuery.or(
      buildOrIlikeFilter(['product_model'], productModelKeywords),
    )
  }

  const materialCodeKeywords = normalizeSearchKeywords(filters.materialCode)

  if (materialCodeKeywords?.length) {
    nextQuery = nextQuery.or(
      buildOrIlikeFilter(['material_code'], materialCodeKeywords),
    )
  }

  if (filters.length_mm?.length) {
    nextQuery = nextQuery.in('length_mm', filters.length_mm)
  }

  if (filters.employeeId) {
    nextQuery = nextQuery.contains('operator_employee_ids', [
      filters.employeeId,
    ])
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

export function normalizeMaterialTransferInsertPayload(
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

export function normalizeMaterialTransferUpdatePayload(
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
      normalizeOperatorPayload(
        values.operator_employee_ids,
        values.operator_names,
      ),
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

export function computeOrderProgress(
  transferTotal: number,
  orderQuantity: number | null,
): MaterialTransferOrderProgress {
  if (!orderQuantity || orderQuantity <= 0) {
    return {
      transferTotal,
      orderQuantity: orderQuantity ?? null,
      completionRate: null,
      isCompleted: false,
    }
  }
  const completionRate = (transferTotal / orderQuantity) * 100
  return {
    transferTotal,
    orderQuantity,
    completionRate,
    isCompleted: completionRate >= 100,
  }
}

export function buildOrderProgressMap(
  orderQuantityMap: Map<string, number>,
  transferTotalMap: Map<string, number>,
): Map<string, MaterialTransferOrderProgress> {
  const result = new Map<string, MaterialTransferOrderProgress>()
  const keys = new Set<string>([
    ...orderQuantityMap.keys(),
    ...transferTotalMap.keys(),
  ])
  for (const key of keys) {
    const orderQuantity = orderQuantityMap.get(key)
    const transferTotal = transferTotalMap.get(key) ?? 0
    result.set(
      key,
      computeOrderProgress(
        transferTotal,
        orderQuantity === undefined ? null : orderQuantity,
      ),
    )
  }
  return result
}
