import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface DefectReasonItem {
  defect_reason_id: string
  quantity: number
}

export interface ProductionRecord {
  id?: string
  production_date: string
  order_id: string
  process_id: string
  qualified_quantity: number
  defective_quantity: number
  defect_reasons: DefectReasonItem[]
  operator_ids: string[]
  remark?: string | null
  production_sheet_id?: string | null
  created_at?: string
  updated_at?: string
}

// 扩展类型，包含关联数据
export interface ProductionRecordWithRelations extends ProductionRecord {
  order?: {
    id: string
    project_no: string | null
    product_model: string | null
    customer_model: string | null
    length_mm: number | null
    weight_per_meter_kg: number | null
  }
  process?: {
    id: string
    process_name: string
  }
  defect_reasons_with_details?: Array<{
    defect_reason_id: string
    quantity: number
    defect_reason?: {
      id: string
      defect_reason: string
    }
  }>
  operators?: Array<{
    id: string
    name: string
  }>
}

export async function getProductionRecords({
  page,
  pageSize,
  startDate,
  endDate,
  order_id,
  process_id,
  product_model,
  project_no,
  operator_id,
}: {
  page: number
  pageSize: number
  startDate?: string
  endDate?: string
  order_id?: string
  process_id?: string
  product_model?: string
  project_no?: string
  operator_id?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('production_records')
    .select(
      `
      *,
      sales_orders!production_records_order_id_fkey (
        id,
        project_no,
        product_model,
        customer_model,
        length_mm,
        weight_per_meter_kg
      ),
      workshop_processes!production_records_process_id_fkey (
        id,
        process_name
      )
    `,
      { count: 'exact' },
    )

  // 日期范围搜索
  if (startDate && endDate) {
    query = query.gte('production_date', startDate).lte('production_date', endDate)
  } else if (startDate) {
    query = query.gte('production_date', startDate)
  } else if (endDate) {
    query = query.lte('production_date', endDate)
  }

  // 订单筛选
  if (order_id) {
    query = query.eq('order_id', order_id)
  }

  // 工序筛选
  if (process_id) {
    query = query.eq('process_id', process_id)
  }

  // 根据项目号 / 型号过滤订单列表
  let filteredOrderIds: string[] | null = null

  if (project_no) {
    const { data: matchingOrders, error: projectError } = await supabase
      .from('sales_orders')
      .select('id')
      .ilike('project_no', `%${project_no}%`)

    if (projectError) {
      throw handleApiError(projectError, '查询项目号失败')
    }

    filteredOrderIds = (matchingOrders || []).map((order) => order.id)
  }

  // 型号筛选 - 通过关联表过滤
  if (product_model) {
    // 先查询匹配型号的订单ID（同时搜索产品型号和客户型号）
    const { data: matchingOrders, error: orderError } = await supabase
      .from('sales_orders')
      .select('id')
      .or(
        `product_model.ilike.%${product_model}%,customer_model.ilike.%${product_model}%`,
      )

    if (orderError) {
      throw handleApiError(orderError, '查询订单型号失败')
    }

    const modelMatchedIds = (matchingOrders || []).map((order) => order.id)

    // 如果已有项目号过滤，则取交集；否则直接赋值
    if (filteredOrderIds !== null) {
      filteredOrderIds = filteredOrderIds.filter((id) =>
        modelMatchedIds.includes(id),
      )
    } else {
      filteredOrderIds = modelMatchedIds
    }
  }

  // 应用订单ID过滤
  if (filteredOrderIds !== null) {
    if (filteredOrderIds.length > 0) {
      query = query.in('order_id', filteredOrderIds)
    } else {
      // 如果没有匹配的订单，使用一个不存在的ID来返回空结果
      query = query.eq('order_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  // 操作者筛选 - 检查 operator_ids 数组是否包含指定的操作者ID
  if (operator_id) {
    // 使用 PostgreSQL 的数组包含操作符 cs (contains) 来查询
    // 语法: operator_ids.cs.{value} 表示数组包含该值
    query = query.filter('operator_ids', 'cs', `{${operator_id}}`)
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('production_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw handleApiError(error, '获取产量记录失败')
  }

  // 批量处理操作者与不良原因，避免每条记录多次请求
  const records = (data || []) as any[]
  const operatorIdSet = new Set<string>()
  const defectReasonIdSet = new Set<string>()

  records.forEach((record) => {
    if (Array.isArray(record.operator_ids)) {
      record.operator_ids.forEach((id: string) => id && operatorIdSet.add(id))
    }
    if (Array.isArray(record.defect_reasons)) {
      record.defect_reasons.forEach((item: any) => {
        if (item?.defect_reason_id) defectReasonIdSet.add(item.defect_reason_id)
      })
    }
  })

  const operatorMap: Record<string, { id: string; name: string }> = {}
  if (operatorIdSet.size > 0) {
    const { data: operators } = await supabase
      .from('employees')
      .select('id, name')
      .in('id', Array.from(operatorIdSet))

    ;(operators || []).forEach((op) => {
      if (op.id) operatorMap[op.id] = { id: op.id, name: op.name }
    })
  }

  const defectReasonMap: Record<string, { id: string; defect_reason: string }> = {}
  if (defectReasonIdSet.size > 0) {
    const { data: defectReasons } = await supabase
      .from('workshop_defect_reasons' as any)
      .select('id, defect_reason')
      .in('id', Array.from(defectReasonIdSet))

    ;(defectReasons || []).forEach((reason: any) => {
      if (reason.id) defectReasonMap[reason.id] = reason
    })
  }

  const recordsWithRelations = records.map((record) => {
    const result: any = {
      ...record,
      order: record.sales_orders || null,
      process: record.workshop_processes || null,
    }
    delete result.sales_orders
    delete result.workshop_processes

    // 合并操作者信息
    result.operators = Array.isArray(record.operator_ids)
      ? record.operator_ids
          .map((id: string) => operatorMap[id])
          .filter(Boolean)
      : []

    // 合并不良原因详情
    result.defect_reasons_with_details = Array.isArray(record.defect_reasons)
      ? record.defect_reasons.map((item: any) => ({
          ...item,
          defect_reason: item?.defect_reason_id ? defectReasonMap[item.defect_reason_id] || null : null,
        }))
      : []

    return result
  })

  return {
    items: recordsWithRelations as ProductionRecordWithRelations[],
    total: count || 0,
  }
}

export async function createProductionRecord(values: ProductionRecord) {
  // 验证操作者数组不为空
  if (!values.operator_ids || values.operator_ids.length === 0) {
    throw new Error('请至少选择一个操作者')
  }

  // 计算不良总数（从不良原因数组中累加）
  const totalDefectiveQuantity = values.defect_reasons
    ? values.defect_reasons.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0

  const recordToInsert = {
    ...values,
    defective_quantity: totalDefectiveQuantity,
    defect_reasons: (values.defect_reasons || []) as any,
  }

  const { error } = await supabase.from('production_records').insert(recordToInsert as any)

  if (error) {
    throw handleApiError(error, '创建产量记录失败')
  }
}

export async function updateProductionRecord({
  id,
  values,
}: {
  id: string
  values: ProductionRecord
}) {
  // 验证操作者数组不为空
  if (!values.operator_ids || values.operator_ids.length === 0) {
    throw new Error('请至少选择一个操作者')
  }

  // 计算不良总数（从不良原因数组中累加）
  const totalDefectiveQuantity = values.defect_reasons
    ? values.defect_reasons.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0

  const recordToUpdate = {
    ...values,
    defective_quantity: totalDefectiveQuantity,
    defect_reasons: (values.defect_reasons || []) as any,
  }

  const { error } = await supabase
    .from('production_records')
    .update(recordToUpdate as any)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新产量记录失败')
  }
}

export async function deleteProductionRecords(ids: string[]) {
  const { error } = await supabase
    .from('production_records')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除产量记录失败')
  }
}

