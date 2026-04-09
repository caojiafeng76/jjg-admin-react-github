import supabase from './supabase'
import { AppError, handleApiError } from '@/utils/errorHandler'
import type { WorkshopOrder } from '@/features/workshop/OrderList'
import {
  DEFAULT_WORKSHOP_ORDER_STATUS,
  normalizeWorkshopOrderStatus,
} from '@/features/workshop/OrderList/orderStatus'

export interface WorkshopOrderDeleteBlocker {
  orderId: string
  projectNo: string | null
  productionItemCount: number
  orderDates: string[]
}

function formatBlockedProjectNos(projectNos: string[], fallbackLabel: string) {
  if (projectNos.length === 0) return fallbackLabel
  if (projectNos.length <= 3) return projectNos.join('、')

  return `${projectNos.slice(0, 3).join('、')} 等${projectNos.length}条订单`
}

function buildSalesOrderPayload(values: WorkshopOrder, mode: 'create' | 'update') {
  const payload: Record<string, unknown> = {
    ...values,
    product_delivery_date:
      values.product_delivery_date !== null
        ? values.product_delivery_date || undefined
        : undefined,
  }

  if (mode === 'create') {
    payload.status = normalizeWorkshopOrderStatus(values.status)
  } else if (values.status != null) {
    payload.status = normalizeWorkshopOrderStatus(values.status)
  } else {
    delete payload.status
  }

  return payload
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
  const grouped = new Map<string, { count: number; dates: Set<string> }>()

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

  return Array.from(grouped.entries()).map(([projectNo, info]) => ({
    orderId: orderMap.get(projectNo)?.id || projectNo,
    projectNo,
    productionItemCount: info.count,
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
  model_search, // 统一的搜索字段，可同时搜索项目号、产品型号和客户型号
  startDate,
  endDate,
}: {
  page: number
  pageSize: number
  project_no?: string
  product_model?: string
  customer_model?: string
  model_search?: string // 统一的搜索字段，支持项目号、产品型号、客户型号
  startDate?: string
  endDate?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('sales_orders')
    .select('*', { count: 'exact' })

  // 统一的搜索字段（同时搜索项目号、产品型号和客户型号，OR逻辑）
  if (model_search) {
    query = query.or(
      `project_no.ilike.%${model_search}%,product_model.ilike.%${model_search}%,customer_model.ilike.%${model_search}%`,
    )
  } else {
    // 如果没有统一搜索，则分别搜索
    // 项目号搜索（模糊匹配）
    if (project_no) {
      query = query.ilike('project_no', `%${project_no}%`)
    }

    // 产品型号搜索（模糊匹配）
    if (product_model) {
      query = query.ilike('product_model', `%${product_model}%`)
    }

    // 客户型号搜索（模糊匹配）
    if (customer_model) {
      query = query.ilike('customer_model', `%${customer_model}%`)
    }
  }

  // 交货日期范围搜索
  if (startDate && endDate) {
    query = query.gte('product_delivery_date', startDate).lte('product_delivery_date', endDate)
  } else if (startDate) {
    query = query.gte('product_delivery_date', startDate)
  } else if (endDate) {
    query = query.lte('product_delivery_date', endDate)
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false })
    .order('project_no', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取车间订单失败')
  }

  return {
    items: (data || []) as WorkshopOrder[],
    total: count || 0,
  }
}

/**
 * 检查项目号是否已存在
 */
async function checkProjectNoExists(projectNo: string | null): Promise<boolean> {
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
async function checkProjectNosExist(projectNos: (string | null)[]): Promise<string[]> {
  const validProjectNos = projectNos.filter((no): no is string => !!no)
  if (validProjectNos.length === 0) return []

  const { data, error } = await supabase
    .from('sales_orders')
    .select('project_no')
    .in('project_no', validProjectNos)

  if (error) {
    throw handleApiError(error, '检查项目号失败')
  }

  return (data || []).map((item) => item.project_no).filter((no): no is string => !!no)
}

export async function createWorkshopOrder(values: WorkshopOrder) {
  // 检查项目号是否已存在
  if (values.project_no) {
    const exists = await checkProjectNoExists(values.project_no)
    if (exists) {
      throw new Error(`项目号 "${values.project_no}" 已存在，无法创建`)
    }
  }

  // 处理 product_delivery_date 可能为 null 的情况
  const insertValues = {
    ...buildSalesOrderPayload(
      {
        ...values,
        status: values.status ?? DEFAULT_WORKSHOP_ORDER_STATUS,
      },
      'create',
    ),
  } as any

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
  const updateValues = buildSalesOrderPayload(values, 'update') as any

  const { error } = await supabase
    .from('sales_orders')
    .update(updateValues)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新车间订单失败')
  }
}

export async function createWorkshopOrdersBatch(rows: WorkshopOrder[]) {
  if (!rows.length) return

  // 检查所有项目号是否已存在
  const projectNos = rows.map((row) => row.project_no)
  const existingProjectNos = await checkProjectNosExist(projectNos)

  if (existingProjectNos.length > 0) {
    throw new Error(
      `以下项目号已存在，无法导入：${existingProjectNos.join('、')}`,
    )
  }

  // 处理 product_delivery_date 可能为 null 的情况
  const insertRows = rows.map(
    (row) =>
      buildSalesOrderPayload(
        {
          ...row,
          status: row.status ?? DEFAULT_WORKSHOP_ORDER_STATUS,
        },
        'create',
      ) as any,
  )

  const { error } = await supabase.from('sales_orders').insert(insertRows)

  if (error) {
    throw handleApiError(error, '批量创建车间订单失败')
  }
}

export async function deleteWorkshopOrders(ids: string[]) {
  await assertWorkshopOrdersNotReferenced(ids)

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
}
