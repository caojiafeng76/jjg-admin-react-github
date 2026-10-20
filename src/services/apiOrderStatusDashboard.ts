import type {
  OrderStatusDashboardFilters,
  OrderStatusDashboardItem,
  OrderStatusDashboardResult,
  OrderStatusDashboardRpcResult,
  OrderStatusProductionDetail,
  PackagingDashboardWorkOrderRow,
  PackagingWorkOrderQueryRow,
  ProcessStandardJobRow,
} from './apiOrderStatusDashboardTypes'
import { handleApiError } from '@/utils/errorHandler'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import {
  buildJobColumns,
  buildProcessJobIndex,
  buildProductionDetail,
  buildReworkRepairInfo,
  calculateInventoryQuantity,
  getAutoCutQuantity,
  groupPackagingRowsByProjectNo,
  isLastProcessProductionRow,
  normalizeStringArray,
  normalizeText,
  PACKAGING_JOB_NAME,
  resolveProductionJobName,
} from './apiOrderStatusDashboardCalculations'
import supabase from './supabase'

export {
  buildJobColumns,
  buildPackagingProductionDetailsForDashboard,
} from './apiOrderStatusDashboardCalculations'
export * from './apiOrderStatusDashboardTypes'

const LOOKUP_PAGE_SIZE = 1000
const PROCESS_STANDARD_JOB_SELECT
  = 'job_name, operation, model, length, part_no, record_type, is_last_process'

export async function getAllProcessStandardJobRows(signal?: AbortSignal) {
  const rows: ProcessStandardJobRow[] = []
  let from = 0

  while (true) {
    const to = from + LOOKUP_PAGE_SIZE - 1
    let query = supabase
      .from('process_standards')
      .select(PROCESS_STANDARD_JOB_SELECT)
      .not('job_name', 'is', null)
      .not('operation', 'is', null)
      .order('job_name', { ascending: true })
      .order('model', { ascending: true })
      .order('operation', { ascending: true })
      .range(from, to)

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

    if (error) {
      throw handleApiError(error, '获取成本核算岗位信息失败')
    }

    const pageRows = (data || []) as unknown as ProcessStandardJobRow[]
    rows.push(...pageRows)

    if (pageRows.length < LOOKUP_PAGE_SIZE) {
      break
    }

    from += LOOKUP_PAGE_SIZE
  }

  return rows
}

async function getPackagingWorkOrderRowsByProjectNos({
  projectNos,
  signal,
}: {
  projectNos: string[]
  signal?: AbortSignal
}) {
  const rows: PackagingDashboardWorkOrderRow[] = []

  for (let index = 0; index < projectNos.length; index += LOOKUP_PAGE_SIZE) {
    const projectNoChunk = projectNos.slice(index, index + LOOKUP_PAGE_SIZE)
    let from = 0

    while (true) {
      const to = from + LOOKUP_PAGE_SIZE - 1
      let query = (
        supabase as unknown as {
          from: (table: string) => ReturnType<typeof supabase.from>
        }
      )
        .from('packaging_work_orders')
        .select(
          `
            id,
            work_date,
            employee_id,
            project_no,
            product_model,
            color_name,
            process_name,
            length_mm,
            part_no,
            weight_per_meter_kg,
            quantity,
            defective_quantity,
            defective_weight_kg,
            defect_reason,
            standard_seconds,
            work_hours,
            extra_qualified_hours,
            remark,
            packaging_employees (
              name
            )
          `,
        )
        .in('project_no', projectNoChunk)
        .order('work_date', { ascending: false })
        .range(from, to)

      if (signal) {
        query = query.abortSignal(signal)
      }

      const { data, error } = await query

      if (error) {
        throw handleApiError(error, '获取包装生产工单数据失败')
      }

      const pageRows = (data || []) as unknown as PackagingWorkOrderQueryRow[]

      for (const row of pageRows) {
        rows.push({
          ...row,
          employee_name: row.employee_name ?? row.packaging_employees?.name,
        })
      }

      if (pageRows.length < LOOKUP_PAGE_SIZE) {
        break
      }

      from += LOOKUP_PAGE_SIZE
    }
  }

  return rows
}

async function getOrderStatusDashboardRpcResult({
  page,
  pageSize,
  filters,
  signal,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
  signal?: AbortSignal
}): Promise<OrderStatusDashboardRpcResult> {
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => ReturnType<typeof supabase.rpc>
  }
  let query = rpcClient.rpc('get_order_status_dashboard_v2', {
    p_customer: filters?.customer || null,
    p_material_code: filters?.materialCode || null,
    p_model_keywords: normalizeSearchKeywords(filters?.model) || null,
    p_order_date: filters?.orderDate || null,
    p_page: page,
    p_page_size: pageSize,
    p_production_status: filters?.productionStatus || null,
    p_project_no: filters?.projectNo || null,
    p_status: filters?.status || null,
  })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取订单现状聚合数据失败')
  }

  return (data || {}) as OrderStatusDashboardRpcResult
}

export async function getOrderStatusDashboard({
  page,
  pageSize,
  filters,
  processRows,
  signal,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
  processRows?: ProcessStandardJobRow[]
  signal?: AbortSignal
}): Promise<OrderStatusDashboardResult> {
  // 外部（如 React Query 缓存）已提供岗位行时跳过全表查询；
  // 未提供时保持原行为（内部按 1000 行/页循环拉取）。
  const [rpcResult, resolvedProcessRows] = await Promise.all([
    getOrderStatusDashboardRpcResult({ page, pageSize, filters, signal }),
    processRows ?? getAllProcessStandardJobRows(signal),
  ])
  const orders = rpcResult.items ?? []
  const total = rpcResult.total ?? 0
  const projectNos = Array.from(
    new Set(
      orders
        .map(order => normalizeText(order.project_no))
        .filter((projectNo): projectNo is string => Boolean(projectNo)),
    ),
  )
  const packagingRows
    = projectNos.length > 0
      ? await getPackagingWorkOrderRowsByProjectNos({ projectNos, signal })
      : []
  const packagingDetailsByProjectNo
    = groupPackagingRowsByProjectNo(packagingRows)
  const processJobIndex = buildProcessJobIndex(resolvedProcessRows)
  const jobColumns = buildJobColumns(processJobIndex)

  const items = orders.map<OrderStatusDashboardItem>((order) => {
    const projectNo = normalizeText(order.project_no)
    const relatedRows = order.productionRows ?? []
    const packagingDetails = projectNo
      ? (packagingDetailsByProjectNo.get(projectNo) ?? [])
      : []
    const jobOutputs = Object.fromEntries(
      jobColumns.map(column => [column.key, 0]),
    ) as Record<string, number>
    const productionDetails: OrderStatusProductionDetail[] = []

    for (const row of relatedRows) {
      const operation = normalizeText(row.operation)
      const jobName = resolveProductionJobName({
        order,
        processJobIndex,
        row,
      })
      const qualifiedQuantity = Number(row.qualified_quantity || 0)

      if (operation) {
        if (
          isLastProcessProductionRow({
            order,
            processJobIndex,
            row,
          })
          && Object.hasOwn(jobOutputs, jobName)
        ) {
          jobOutputs[jobName] = (jobOutputs[jobName] || 0) + qualifiedQuantity
        }

        productionDetails.push(buildProductionDetail(row, jobName))
      }
    }

    if (packagingDetails.length > 0) {
      jobOutputs[PACKAGING_JOB_NAME] = packagingDetails.reduce(
        (total, detail) => total + Number(detail.qualifiedQuantity || 0),
        0,
      )
      productionDetails.push(...packagingDetails)
    }

    productionDetails.sort((left, right) => {
      const leftDate = left.orderDate || left.createdAt
      const rightDate = right.orderDate || right.createdAt

      return rightDate.localeCompare(leftDate)
    })

    const precisionCuttingQuantity = Number(order.precisionCuttingQuantity || 0)
    const totalDefectQuantity = Number(order.totalDefectQuantity || 0)
    const transferQuantity = Number(order.transferQuantity || 0)
    const autoCutQuantity = getAutoCutQuantity(jobOutputs)

    return {
      ...order,
      id: order.id || projectNo || crypto.randomUUID(),
      jobOutputs,
      productionDetails,
      totalIncomingQuantity: Number(order.totalIncomingQuantity || 0),
      totalQualifiedQuantity: Number(order.totalQualifiedQuantity || 0),
      totalDefectQuantity,
      precisionCuttingQuantity,
      precisionCuttingDetails: order.precisionCuttingDetails ?? [],
      autoCutQuantity,
      inventoryQuantity: calculateInventoryQuantity({
        autoCutQuantity,
        defectQuantity: totalDefectQuantity,
        precisionCuttingQuantity,
        transferQuantity,
      }),
      extrusionQuantity: Number(order.extrusionQuantity || 0),
      extrusionDetails: order.extrusionDetails ?? [],
      transferQuantity,
      warehouseTransferQuantity: Number(order.warehouseTransferQuantity || 0),
      transferRecordCount: Number(order.transferRecordCount || 0),
      transferWorkshops: order.transferWorkshops ?? [],
      latestTransferWorkshop: order.latestTransferWorkshop ?? null,
      latestTransferAt: order.latestTransferAt ?? null,
      latestTransferOperatorNames: normalizeStringArray(
        order.latestTransferOperatorNames,
      ),
      transferDetails: order.transferDetails ?? [],
      finishedQuantity: Number(order.finishedQuantity || 0),
      completionRate: order.completionRate,
      yieldRate: order.yieldRate,
      productionStatus: order.productionStatus,
      reworkRepairInfo: buildReworkRepairInfo(order.reworkRepairRows ?? null),
    }
  })

  return {
    items,
    total,
    jobColumns,
    productionItemCount:
      (rpcResult.productionItemCount ?? 0) + packagingRows.length,
    materialTransferCount: rpcResult.materialTransferCount ?? 0,
    kpis: {
      totalOrderCount: total,
      normalOrderCount: Number(rpcResult.kpis?.normalOrderCount ?? 0),
      warningOrderCount: Number(rpcResult.kpis?.warningOrderCount ?? 0),
      overdueOrderCount: Number(rpcResult.kpis?.overdueOrderCount ?? 0),
      avgCompletionRate: Number(rpcResult.kpis?.avgCompletionRate ?? 0),
      avgYieldRate: Number(rpcResult.kpis?.avgYieldRate ?? 0),
      productionItemCount: Number(rpcResult.kpis?.productionItemCount ?? 0),
      materialTransferCount: Number(rpcResult.kpis?.materialTransferCount ?? 0),
    },
  }
}

// RPC get_order_status_dashboard_v2 内部对 page_size 做了 least(..., 200) 截断，
// 导出必须按 200/页循环拉取，避免超过 200 条订单时导出不全。
const ORDER_STATUS_DASHBOARD_EXPORT_PAGE_SIZE = 200

export async function getOrderStatusDashboardForExport({
  filters,
  total,
  signal,
}: {
  filters?: OrderStatusDashboardFilters
  total: number
  signal?: AbortSignal
}) {
  if (total <= 0) {
    return []
  }

  const items: OrderStatusDashboardItem[] = []
  let collected = 0

  while (collected < total) {
    const result = await getOrderStatusDashboard({
      filters,
      page: collected / ORDER_STATUS_DASHBOARD_EXPORT_PAGE_SIZE + 1,
      pageSize: ORDER_STATUS_DASHBOARD_EXPORT_PAGE_SIZE,
      signal,
    })
    const pageItems = result.items ?? []

    if (pageItems.length === 0) {
      break
    }

    items.push(...pageItems)
    collected += pageItems.length

    if (pageItems.length < ORDER_STATUS_DASHBOARD_EXPORT_PAGE_SIZE) {
      break
    }
  }

  return items
}
