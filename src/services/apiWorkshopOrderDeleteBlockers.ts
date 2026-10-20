import { AppError, handleApiError } from '@/utils/errorHandler'
import { formatBlockedProjectNos } from './apiWorkshopOrdersCalculations'
import supabase from './supabase'

export interface WorkshopOrderDeleteBlocker {
  orderId: string
  projectNo: string | null
  productionItemCount: number
  extrusionProductionItemCount: number
  orderDates: string[]
}

export async function assertWorkshopOrdersNotReferenced(ids: string[]) {
  const blockers = await getWorkshopOrderDeleteBlockers(ids)

  if (blockers.length === 0) {
    return
  }

  throw new AppError(
    `订单 ${formatBlockedProjectNos(
      blockers
        .map(item => item.projectNo?.trim())
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
    .map(order => order.project_no?.trim())
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
      .filter(order => order.project_no?.trim())
      .map(order => [order.project_no!.trim(), order]),
  )
  const grouped = new Map<
    string,
    { count: number, dates: Set<string>, extrusionCount: number }
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
