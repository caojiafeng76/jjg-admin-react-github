import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { WorkshopOrder } from '@/features/workshop/OrderList'

export async function getWorkshopOrders({
  page,
  pageSize,
  project_no,
  product_model,
  customer_model,
  startDate,
  endDate,
}: {
  page: number
  pageSize: number
  project_no?: string
  product_model?: string
  customer_model?: string
  startDate?: string
  endDate?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('sales_orders')
    .select('*', { count: 'exact' })

  // 项目号搜索（精确匹配）
  if (project_no) {
    query = query.eq('project_no', project_no)
  }

  // 产品型号搜索（模糊匹配）
  if (product_model) {
    query = query.ilike('product_model', `%${product_model}%`)
  }

  // 客户型号搜索（模糊匹配）
  if (customer_model) {
    query = query.ilike('customer_model', `%${customer_model}%`)
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
    .order('product_delivery_date', { ascending: false })

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
    ...values,
    product_delivery_date: values.product_delivery_date || undefined,
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
  const updateValues = {
    ...values,
    product_delivery_date: values.product_delivery_date !== null ? values.product_delivery_date : undefined,
  } as any

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
  const insertRows = rows.map((row) => ({
    ...row,
    product_delivery_date: row.product_delivery_date || undefined,
  })) as any[]

  const { error } = await supabase.from('sales_orders').insert(insertRows)

  if (error) {
    throw handleApiError(error, '批量创建车间订单失败')
  }
}

export async function deleteWorkshopOrders(ids: string[]) {
  const { error } = await supabase.from('sales_orders').delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除车间订单失败')
  }
}
