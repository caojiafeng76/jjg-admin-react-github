import supabase from './supabase'
import type { Database } from './database.types'
import { AppError, handleApiError } from '@/utils/errorHandler'
import {
  buildOrIlikeFilter,
  normalizeSearchKeywords,
} from '@/utils/searchKeywords'
import type { WorkshopOrder } from '@/features/workshop/OrderList'
import {
  DEFAULT_WORKSHOP_ORDER_STATUS,
  canWorkshopOrderBeClosed,
  normalizeWorkshopOrderStatus,
} from '@/features/workshop/OrderList/orderStatus'

const WORKSHOP_ORDER_SKETCH_BUCKET = 'workshop-order-sketches'

type SalesOrderInsert = Database['public']['Tables']['sales_orders']['Insert']
type SalesOrderUpdate = Database['public']['Tables']['sales_orders']['Update']

export interface WorkshopOrderDeleteBlocker {
  orderId: string
  projectNo: string | null
  productionItemCount: number
  extrusionProductionItemCount: number
  orderDates: string[]
}

function formatBlockedProjectNos(projectNos: string[], fallbackLabel: string) {
  if (projectNos.length === 0) return fallbackLabel
  if (projectNos.length <= 3) return projectNos.join('、')

  return `${projectNos.slice(0, 3).join('、')} 等${projectNos.length}条订单`
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return value ?? null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeOptionalNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null
  }

  return value
}

function sanitizeStoragePathPart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildSketchPath(row: WorkshopOrder, index: number) {
  const projectNo = sanitizeStoragePathPart(row.project_no || '') || 'unknown'
  const fileName =
    sanitizeStoragePathPart(row.sketch_file?.fileName || '') ||
    `sketch.${row.sketch_file?.extension || 'emf'}`

  return `${projectNo}/${Date.now()}-${index + 1}-${fileName}`
}

async function removeWorkshopOrderSketchFiles(paths: string[]) {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)))
  if (uniquePaths.length === 0) return

  const { error } = await supabase.storage
    .from(WORKSHOP_ORDER_SKETCH_BUCKET)
    .remove(uniquePaths)

  if (error) {
    console.warn('订单简图删除失败:', error)
  }
}

async function uploadWorkshopOrderSketch(
  row: WorkshopOrder,
  index: number,
): Promise<{ path: string | null; uploadedPath: string | null }> {
  const sketchFile = row.sketch_file
  if (!sketchFile) {
    return { path: row.sketch_file_path ?? null, uploadedPath: null }
  }

  const filePath = buildSketchPath(row, index)
  const { error } = await supabase.storage
    .from(WORKSHOP_ORDER_SKETCH_BUCKET)
    .upload(
      filePath,
      new Blob([sketchFile.data], { type: sketchFile.mimeType }),
      {
        contentType: sketchFile.mimeType,
        upsert: false,
      },
    )

  if (error) {
    throw handleApiError(error, '订单简图上传失败')
  }

  return { path: filePath, uploadedPath: filePath }
}

function normalizeWorkshopOrderInput(values: WorkshopOrder): WorkshopOrder {
  return {
    ...values,
    product_delivery_date: normalizeOptionalText(values.product_delivery_date),
    project_no: normalizeOptionalText(values.project_no),
    product_model: normalizeOptionalText(values.product_model),
    length_mm: normalizeOptionalNumber(values.length_mm),
    length_tolerance: normalizeOptionalText(values.length_tolerance),
    process_flow: normalizeOptionalText(values.process_flow),
    customer: normalizeOptionalText(values.customer),
    customer_model: normalizeOptionalText(values.customer_model),
    order_quantity: normalizeOptionalNumber(values.order_quantity),
    weight_per_meter_kg: normalizeOptionalNumber(values.weight_per_meter_kg),
    color_name: normalizeOptionalText(values.color_name),
    package_name: normalizeOptionalText(values.package_name),
    product_category: normalizeOptionalText(values.product_category),
    material_name: normalizeOptionalText(values.material_name),
    material_code: normalizeOptionalText(values.material_code),
    row_remark: normalizeOptionalText(values.row_remark),
    sketch_file_path: normalizeOptionalText(values.sketch_file_path),
  }
}

function hasMeaningfulWorkshopOrderContent(values: WorkshopOrder) {
  return Boolean(
    values.project_no ||
    values.product_model ||
    values.customer ||
    values.customer_model ||
    values.process_flow ||
    values.material_code ||
    values.length_mm !== null ||
    values.order_quantity !== null ||
    values.weight_per_meter_kg !== null,
  )
}

function assertWorkshopOrderHasMeaningfulContent(
  values: WorkshopOrder,
  label: string,
) {
  if (hasMeaningfulWorkshopOrderContent(values)) {
    return
  }

  throw new Error(
    `${label}没有任何有效内容，请先填写项目号、产品型号、长度、订支数等信息后再提交`,
  )
}

function buildSalesOrderPayload(
  values: WorkshopOrder,
  mode: 'create',
): SalesOrderInsert
function buildSalesOrderPayload(
  values: WorkshopOrder,
  mode: 'update',
): SalesOrderUpdate
function buildSalesOrderPayload(
  values: WorkshopOrder,
  mode: 'create' | 'update',
): SalesOrderInsert | SalesOrderUpdate {
  const normalizedValues = normalizeWorkshopOrderInput(values)
  const hasClosedAtValue = Object.prototype.hasOwnProperty.call(
    values,
    'closed_at',
  )

  const payload: SalesOrderUpdate = {
    product_delivery_date: normalizedValues.product_delivery_date,
    project_no: normalizedValues.project_no,
    product_model: normalizedValues.product_model,
    length_mm: normalizedValues.length_mm,
    length_tolerance: normalizedValues.length_tolerance,
    process_flow: normalizedValues.process_flow,
    customer: normalizedValues.customer,
    customer_model: normalizedValues.customer_model,
    order_quantity: normalizedValues.order_quantity,
    weight_per_meter_kg: normalizedValues.weight_per_meter_kg,
    color_name: normalizedValues.color_name,
    package_name: normalizedValues.package_name,
    product_category: normalizedValues.product_category,
    material_name: normalizedValues.material_name,
    material_code: normalizedValues.material_code,
    row_remark: normalizedValues.row_remark ?? null,
    sketch_file_path: normalizedValues.sketch_file_path ?? null,
  }

  if (mode === 'create') {
    return {
      ...payload,
      status: normalizeWorkshopOrderStatus(normalizedValues.status),
    }
  }

  if (normalizedValues.status != null) {
    payload.status = normalizeWorkshopOrderStatus(normalizedValues.status)
  } else {
    delete payload.status
  }

  if (mode === 'update' && hasClosedAtValue) {
    payload.closed_at = normalizeOptionalText(values.closed_at)
  }

  return payload
}

export function buildWorkshopOrderStatusUpdateValues(
  status: WorkshopOrder['status'],
  closedAt: Date | string = new Date(),
): SalesOrderUpdate {
  const normalizedStatus = normalizeWorkshopOrderStatus(status)
  const normalizedClosedAt =
    typeof closedAt === 'string' ? closedAt : closedAt.toISOString()

  return {
    status: normalizedStatus,
    closed_at: normalizedStatus === '已结案' ? normalizedClosedAt : null,
  }
}

async function assertWorkshopOrdersNotReferenced(ids: string[]) {
  const blockers = await getWorkshopOrderDeleteBlockers(ids)

  if (blockers.length === 0) {
    return
  }

  throw new AppError(
    `订单 ${formatBlockedProjectNos(
      blockers
        .map((item) => item.projectNo?.trim())
        .filter((projectNo): projectNo is string => Boolean(projectNo)),
      '所选订单',
    )} 已关联生产工单明细，无法删除`,
    'FOREIGN_KEY_CONSTRAINT',
  )
}

export async function getWorkshopOrderDeleteBlockers(
  ids: string[],
): Promise<WorkshopOrderDeleteBlocker[]> {
  const { data: orders, error: ordersError } = await supabase
    .from('sales_orders')
    .select('id, project_no')
    .in('id', ids)

  if (ordersError) {
    throw handleApiError(ordersError, '检查订单引用失败')
  }

  const selectedProjectNos = (orders || [])
    .map((order) => order.project_no?.trim())
    .filter((projectNo): projectNo is string => Boolean(projectNo))

  if (selectedProjectNos.length === 0) {
    return []
  }

  const { data: productionItems, error: referenceError } = await supabase
    .from('production_order_items')
    .select(
      `
      project_no,
      order_id,
      production_orders(order_date)
    `,
    )
    .in('project_no', selectedProjectNos)

  if (referenceError) {
    throw handleApiError(referenceError, '检查订单引用失败')
  }

  const orderMap = new Map(
    (orders || [])
      .filter((order) => order.project_no?.trim())
      .map((order) => [order.project_no!.trim(), order]),
  )
  const grouped = new Map<
    string,
    { count: number; dates: Set<string>; extrusionCount: number }
  >()

  ;(
    (productionItems || []) as Array<{
      project_no: string
      order_id: string
      production_orders:
        | {
            order_date: string
          }
        | Array<{ order_date: string }>
        | null
    }>
  ).forEach((item) => {
    const projectNo = item.project_no?.trim()

    if (!projectNo || !orderMap.has(projectNo)) {
      return
    }

    const current = grouped.get(projectNo) || {
      count: 0,
      dates: new Set<string>(),
      extrusionCount: 0,
    }

    current.count += 1

    const productionOrder = Array.isArray(item.production_orders)
      ? item.production_orders[0]
      : item.production_orders

    if (productionOrder?.order_date) {
      current.dates.add(productionOrder.order_date)
    }

    grouped.set(projectNo, current)
  })

  const { data: extrusionItems, error: extrusionError } = await supabase
    .from('extrusion_production_items')
    .select('project_no')
    .in('project_no', selectedProjectNos)

  if (extrusionError) {
    throw handleApiError(extrusionError, '检查挤压明细引用失败')
  }

  ;((extrusionItems || []) as Array<{ project_no: string | null }>).forEach(
    (item) => {
      const projectNo = item.project_no?.trim()

      if (!projectNo || !orderMap.has(projectNo)) {
        return
      }

      const current = grouped.get(projectNo) || {
        count: 0,
        dates: new Set<string>(),
        extrusionCount: 0,
      }

      current.extrusionCount += 1
      grouped.set(projectNo, current)
    },
  )

  return Array.from(grouped.entries()).map(([projectNo, info]) => ({
    orderId: orderMap.get(projectNo)?.id || projectNo,
    projectNo,
    productionItemCount: info.count,
    extrusionProductionItemCount: info.extrusionCount ?? 0,
    orderDates: Array.from(info.dates).sort((left, right) =>
      right.localeCompare(left),
    ),
  }))
}

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

  let query = supabase.from('sales_orders').select('*', { count: 'exact' })

  const projectNoKeywords = normalizeSearchKeywords(project_no_search)
  const modelSearchKeywords = normalizeSearchKeywords(model_search)
  const productDeliveryDateSearch = normalizeOptionalText(
    product_delivery_date_search,
  )
  const materialCode = normalizeOptionalText(material_code)

  // 项目号多关键词搜索（OR 逻辑，只搜索 project_no 列）
  if (projectNoKeywords?.length) {
    query = query.or(buildOrIlikeFilter(['project_no'], projectNoKeywords))
  } else if (project_no) {
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
  } else {
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
  } else if (startDate) {
    query = query.gte('product_delivery_date', startDate)
  } else if (endDate) {
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

  const items = ((data || []) as WorkshopOrder[]).map((item) => ({ ...item }))

  const projectNos = Array.from(
    new Set(
      items
        .map((item) => item.project_no?.trim())
        .filter((projectNo): projectNo is string => Boolean(projectNo)),
    ),
  )

  if (includeOutboundSummary && projectNos.length > 0) {
    let transferQuery = supabase
      .from('material_transfers')
      .select('project_no, transfer_quantity')
      .in('project_no', projectNos)

    if (signal) {
      transferQuery = transferQuery.abortSignal(signal)
    }

    const { data: transferRows, error: transferError } = await transferQuery

    if (transferError) {
      throw handleApiError(transferError, '获取订单出库统计失败')
    }

    const outboundTotalByProjectNo = new Map<string, number>()

    for (const row of (transferRows || []) as Array<{
      project_no: string
      transfer_quantity: number | null
    }>) {
      const projectNo = row.project_no?.trim()

      if (!projectNo) {
        continue
      }

      outboundTotalByProjectNo.set(
        projectNo,
        (outboundTotalByProjectNo.get(projectNo) || 0) +
          Number(row.transfer_quantity || 0),
      )
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

export async function downloadWorkshopOrderSketchFile(filePath: string) {
  const { data, error } = await supabase.storage
    .from(WORKSHOP_ORDER_SKETCH_BUCKET)
    .download(filePath)

  if (error) {
    throw handleApiError(error, '订单简图下载失败')
  }

  return data.arrayBuffer()
}

/**
 * 检查项目号是否已存在
 */
async function checkProjectNoExists(
  projectNo: string | null,
): Promise<boolean> {
  if (!projectNo) return false

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
  if (validProjectNos.length === 0) return []

  const { data, error } = await supabase
    .from('sales_orders')
    .select('project_no')
    .in('project_no', validProjectNos)

  if (error) {
    throw handleApiError(error, '检查项目号失败')
  }

  return (data || [])
    .map((item) => item.project_no)
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
  if (!rows.length) return

  const normalizedRows = rows.map((row) => normalizeWorkshopOrderInput(row))
  const uploadedSketchPaths: string[] = []

  normalizedRows.forEach((row, index) => {
    assertWorkshopOrderHasMeaningfulContent(row, `第 ${index + 1} 行订单`)
  })

  // 检查所有项目号是否已存在
  const projectNos = normalizedRows.map((row) => row.project_no)
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
  } catch (error) {
    await removeWorkshopOrderSketchFiles(uploadedSketchPaths)
    throw error
  }

  const insertRows = rowsWithSketchPaths.map(
    (row) =>
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
      .map((row) => row.sketch_file_path)
      .filter((path): path is string => Boolean(path)),
  )
}
