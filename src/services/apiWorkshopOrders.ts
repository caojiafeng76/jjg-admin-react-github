import type { WorkshopOrder } from '@/features/workshop/OrderList'
import {
  canWorkshopOrderBeClosed,
  DEFAULT_WORKSHOP_ORDER_STATUS,
  normalizeWorkshopOrderStatus,
} from '@/features/workshop/OrderList/orderStatus'
import { AppError, handleApiError } from '@/utils/errorHandler'
import {
  buildOrIlikeFilter,
  normalizeSearchKeywords,
} from '@/utils/searchKeywords'
import { assertWorkshopOrdersNotReferenced } from './apiWorkshopOrderDeleteBlockers'
import {
  assertWorkshopOrderHasMeaningfulContent,
  buildSalesOrderPayload,
  buildWorkshopOrderStatusUpdateValues,
  findDuplicateProjectNos,
  normalizeOptionalText,
  normalizeWorkshopOrderInput,
} from './apiWorkshopOrdersCalculations'
import {
  removeWorkshopOrderSketchFiles,
  uploadWorkshopOrderSketch,
} from './apiWorkshopOrderSketches'
import supabase from './supabase'

export {
  getWorkshopOrderDeleteBlockers,
  type WorkshopOrderDeleteBlocker,
} from './apiWorkshopOrderDeleteBlockers'
export {
  buildWorkshopOrderStatusUpdateValues,
  findDuplicateProjectNos,
} from './apiWorkshopOrdersCalculations'
export { downloadWorkshopOrderSketchFile } from './apiWorkshopOrderSketches'

export async function getWorkshopOrders({
  page,
  pageSize,
  project_no,
  product_model,
  customer_model,
  material_code,
  project_no_search, // 多关键词搜索项目号
  model_search, // 多关键词搜索产品型号、客户型号
  product_delivery_date_search,
  length_mm,
  startDate,
  endDate,
  status,
  includeOutboundSummary = true,
  signal,
}: {
  page: number
  pageSize: number
  project_no?: string
  product_model?: string
  customer_model?: string
  material_code?: string
  project_no_search?: string | string[] // 多关键词搜索项目号
  model_search?: string | string[] // 多关键词搜索产品型号、客户型号
  product_delivery_date_search?: string
  length_mm?: number[]
  startDate?: string
  endDate?: string
  status?: WorkshopOrder['status']
  includeOutboundSummary?: boolean
  signal?: AbortSignal
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 列表所需列（表格 + 编辑表单 + 打印/导出共用字段，排除 process_schedules 等大字段）
  let query = supabase
    .from('sales_orders')
    .select(
      'id, status, closed_at, sketch_file_path, product_delivery_date, process_flow, customer, project_no, product_model, customer_model, weight_per_meter_kg, length_mm, length_tolerance, order_quantity, product_category, color_name, package_name, material_name, material_code, row_remark',
      { count: 'exact' },
    )

  const projectNoKeywords = normalizeSearchKeywords(project_no_search)
  const modelSearchKeywords = normalizeSearchKeywords(model_search)
  const productDeliveryDateSearch = normalizeOptionalText(
    product_delivery_date_search,
  )
  const materialCode = normalizeOptionalText(material_code)

  // 项目号多关键词搜索（OR 逻辑，只搜索 project_no 列）
  if (projectNoKeywords?.length) {
    query = query.or(buildOrIlikeFilter(['project_no'], projectNoKeywords))
  }
  else if (project_no) {
    // 向后兼容单关键词项目号搜索
    query = query.ilike('project_no', `%${project_no}%`)
  }

  // 型号多关键词搜索（OR 逻辑，同时搜索产品型号和客户型号）
  if (modelSearchKeywords?.length) {
    query = query.or(
      buildOrIlikeFilter(
        ['product_model', 'customer_model'],
        modelSearchKeywords,
      ),
    )
  }
  else {
    // 向后兼容单独的型号搜索字段
    if (product_model) {
      query = query.ilike('product_model', `%${product_model}%`)
    }
    if (customer_model) {
      query = query.ilike('customer_model', `%${customer_model}%`)
    }
  }

  // 交货日期范围搜索
  if (productDeliveryDateSearch) {
    query = query.ilike(
      'product_delivery_date',
      `%${productDeliveryDateSearch}%`,
    )
  }

  if (startDate && endDate) {
    query = query
      .gte('product_delivery_date', startDate)
      .lte('product_delivery_date', endDate)
  }
  else if (startDate) {
    query = query.gte('product_delivery_date', startDate)
  }
  else if (endDate) {
    query = query.lte('product_delivery_date', endDate)
  }

  if (length_mm?.length) {
    query = query.in('length_mm', length_mm)
  }

  if (materialCode) {
    query = query.ilike('material_code', `%${materialCode}%`)
  }

  if (status) {
    query = query.filter('status', 'eq', normalizeWorkshopOrderStatus(status))
  }

  query = query
    .range(from, to)
    .order('created_at', { ascending: false })
    .order('project_no', { ascending: true })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query

  if (error) {
    throw handleApiError(error, '获取车间订单失败')
  }

  const items = ((data || []) as WorkshopOrder[]).map(item => ({ ...item }))

  const projectNos = Array.from(
    new Set(
      items
        .map(item => item.project_no?.trim())
        .filter((projectNo): projectNo is string => Boolean(projectNo)),
    ),
  )

  if (includeOutboundSummary && projectNos.length > 0) {
    // 出库记录按项目号 in 过滤，多个项目的合计记录数可能超过 1000（db-max-rows），
    // 按 1000/页循环拉取后聚合，避免出库统计缺失。
    const OUTBOUND_PAGE_SIZE = 1000
    const outboundTotalByProjectNo = new Map<string, number>()
    let transferFrom = 0

    while (true) {
      const transferTo = transferFrom + OUTBOUND_PAGE_SIZE - 1
      let transferQuery = supabase
        .from('material_transfers')
        .select('project_no, transfer_quantity')
        .in('project_no', projectNos)
        .order('project_no', { ascending: true })
        .range(transferFrom, transferTo)

      if (signal) {
        transferQuery = transferQuery.abortSignal(signal)
      }

      const { data: transferRows, error: transferError } = await transferQuery

      if (transferError) {
        throw handleApiError(transferError, '获取订单出库统计失败')
      }

      const pageRows = (transferRows || []) as Array<{
        project_no: string
        transfer_quantity: number | null
      }>

      for (const row of pageRows) {
        const projectNo = row.project_no?.trim()

        if (!projectNo) {
          continue
        }

        outboundTotalByProjectNo.set(
          projectNo,
          (outboundTotalByProjectNo.get(projectNo) || 0)
          + Number(row.transfer_quantity || 0),
        )
      }

      if (pageRows.length < OUTBOUND_PAGE_SIZE) {
        break
      }

      transferFrom += OUTBOUND_PAGE_SIZE
    }

    for (const item of items) {
      const projectNo = item.project_no?.trim()

      item.total_outbound_quantity = projectNo
        ? outboundTotalByProjectNo.get(projectNo) || 0
        : 0
    }
  }

  if (status === '生产中') {
    items.sort((left, right) => {
      const leftPriority = canWorkshopOrderBeClosed({
        status: left.status,
        orderQuantity: left.order_quantity,
        totalOutbound: left.total_outbound_quantity,
      })
        ? 1
        : 0
      const rightPriority = canWorkshopOrderBeClosed({
        status: right.status,
        orderQuantity: right.order_quantity,
        totalOutbound: right.total_outbound_quantity,
      })
        ? 1
        : 0

      return rightPriority - leftPriority
    })
  }

  return {
    items,
    total: count || 0,
  }
}

export interface WorkshopOrderOptions {
  projectNos: string[]
  productModels: string[]
  lengths: number[]
}

export async function getWorkshopOrderOptions(
  signal?: AbortSignal,
): Promise<WorkshopOrderOptions> {
  let query = supabase.rpc('get_workshop_order_options')

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.single()

  if (error) {
    throw handleApiError(error, '获取车间订单选项失败')
  }

  return {
    projectNos: data?.project_nos ?? [],
    productModels: data?.product_models ?? [],
    lengths: data?.lengths ?? [],
  }
}

export async function getWorkshopOrderById(id: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('订单不存在或已被删除')
    }

    throw handleApiError(error, '获取订单详情失败')
  }

  if (!data) {
    throw new Error('订单不存在或已被删除')
  }

  return data as WorkshopOrder
}

/**
 * 检查项目号是否已存在
 */
async function checkProjectNoExists(
  projectNo: string | null,
): Promise<boolean> {
  if (!projectNo)
    return false

  const { data, error } = await supabase
    .from('sales_orders')
    .select('id')
    .eq('project_no', projectNo)
    .limit(1)

  if (error) {
    throw handleApiError(error, '检查项目号失败')
  }

  return (data?.length || 0) > 0
}

/**
 * 批量检查项目号是否已存在
 */
async function checkProjectNosExist(
  projectNos: (string | null)[],
): Promise<string[]> {
  const validProjectNos = projectNos.filter((no): no is string => !!no)
  if (validProjectNos.length === 0)
    return []

  const { data, error } = await supabase
    .from('sales_orders')
    .select('project_no')
    .in('project_no', validProjectNos)

  if (error) {
    throw handleApiError(error, '检查项目号失败')
  }

  return (data || [])
    .map(item => item.project_no)
    .filter((no): no is string => !!no)
}

export async function createWorkshopOrder(values: WorkshopOrder) {
  const normalizedValues = normalizeWorkshopOrderInput(values)

  assertWorkshopOrderHasMeaningfulContent(normalizedValues, '订单')

  // 检查项目号是否已存在
  if (normalizedValues.project_no) {
    const exists = await checkProjectNoExists(normalizedValues.project_no)
    if (exists) {
      throw new Error(
        `项目号 "${normalizedValues.project_no}" 已存在，无法创建`,
      )
    }
  }

  const insertValues = buildSalesOrderPayload(
    {
      ...normalizedValues,
      status: normalizedValues.status ?? DEFAULT_WORKSHOP_ORDER_STATUS,
    },
    'create',
  )

  const { error } = await supabase.from('sales_orders').insert(insertValues)

  if (error) {
    throw handleApiError(error, '创建车间订单失败')
  }
}

export async function updateWorkshopOrder({
  id,
  values,
}: {
  id: string
  values: WorkshopOrder
}) {
  // 如果更新了项目号，需要检查新项目号是否已被其他记录使用
  if (values.project_no) {
    const { data: existingRecord } = await supabase
      .from('sales_orders')
      .select('project_no')
      .eq('id', id)
      .single()

    // 如果项目号发生了变化，需要检查新项目号是否已存在
    if (existingRecord?.project_no !== values.project_no) {
      const exists = await checkProjectNoExists(values.project_no)
      if (exists) {
        throw new Error(`项目号 "${values.project_no}" 已存在，无法更新`)
      }
    }
  }

  // 处理 product_delivery_date 可能为 null 的情况
  const updateValues = buildSalesOrderPayload(values, 'update')

  const { error } = await supabase
    .from('sales_orders')
    .update(updateValues)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新车间订单失败')
  }
}

export async function updateWorkshopOrderStatuses({
  ids,
  status,
  closed_at,
}: {
  ids: string[]
  status: WorkshopOrder['status']
  closed_at?: string | null
}) {
  if (!ids.length) {
    return
  }

  const updateValues = buildWorkshopOrderStatusUpdateValues(
    status,
    closed_at ?? new Date(),
  )

  const { error } = await supabase
    .from('sales_orders')
    .update(updateValues)
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '批量更新车间订单状态失败')
  }
}

export async function createWorkshopOrdersBatch(rows: WorkshopOrder[]) {
  if (!rows.length)
    return

  const normalizedRows = rows.map(row => normalizeWorkshopOrderInput(row))
  const uploadedSketchPaths: string[] = []

  normalizedRows.forEach((row, index) => {
    assertWorkshopOrderHasMeaningfulContent(row, `第 ${index + 1} 行订单`)
  })

  // 检查所有项目号是否已存在
  const projectNos = normalizedRows.map(row => row.project_no)
  const duplicateProjectNos = findDuplicateProjectNos(projectNos)

  if (duplicateProjectNos.length > 0) {
    throw new Error(`导入数据存在重复项目号：${duplicateProjectNos.join('、')}`)
  }

  const existingProjectNos = await checkProjectNosExist(projectNos)

  if (existingProjectNos.length > 0) {
    throw new Error(
      `以下项目号已存在，无法导入：${existingProjectNos.join('、')}`,
    )
  }

  const rowsWithSketchPaths: WorkshopOrder[] = []
  try {
    for (let index = 0; index < normalizedRows.length; index += 1) {
      const row = normalizedRows[index]
      const { path, uploadedPath } = await uploadWorkshopOrderSketch(row, index)

      if (uploadedPath) {
        uploadedSketchPaths.push(uploadedPath)
      }

      rowsWithSketchPaths.push({
        ...row,
        sketch_file_path: path,
        sketch_file: null,
      })
    }
  }
  catch (error) {
    await removeWorkshopOrderSketchFiles(uploadedSketchPaths)
    throw error
  }

  const insertRows = rowsWithSketchPaths.map(row =>
    buildSalesOrderPayload(
      {
        ...row,
        status: row.status ?? DEFAULT_WORKSHOP_ORDER_STATUS,
      },
      'create',
    ),
  )

  const { error } = await supabase.from('sales_orders').insert(insertRows)

  if (error) {
    await removeWorkshopOrderSketchFiles(uploadedSketchPaths)
    throw handleApiError(error, '批量创建车间订单失败')
  }
}

export async function deleteWorkshopOrders(ids: string[]) {
  await assertWorkshopOrdersNotReferenced(ids)

  const { data: sketchRows, error: sketchError } = await supabase
    .from('sales_orders')
    .select('sketch_file_path')
    .in('id', ids)

  if (sketchError) {
    throw handleApiError(sketchError, '获取订单简图失败')
  }

  const { error } = await supabase.from('sales_orders').delete().in('id', ids)

  if (error) {
    if (error.code === '23503') {
      throw new AppError(
        '所选订单已关联生产工单明细，无法删除',
        'FOREIGN_KEY_CONSTRAINT',
      )
    }
    throw handleApiError(error, '删除车间订单失败')
  }

  await removeWorkshopOrderSketchFiles(
    (sketchRows || [])
      .map(row => row.sketch_file_path)
      .filter((path): path is string => Boolean(path)),
  )
}
