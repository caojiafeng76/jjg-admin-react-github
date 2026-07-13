import type {} from '../_shared/edge-runtime.d.ts'

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { assertAdmin } from '../_shared/admin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  buildProductionDailyReportExcelBuffer,
  getProductionDailyReportExportFilename,
  type ProductionDailyReportExportRow,
} from '../_shared/production-daily-report-export-workbook.ts'

type ProductionOrderDataCategory = 'A' | 'B'

interface ProductionDailyReportFilters {
  startDate?: string
  endDate?: string
  dataCategory?: ProductionOrderDataCategory
  projectNo?: string
  productModel?: string[]
  customerModel?: string
  operation?: string
  employeeId?: string
}

interface StartExportPayload {
  action?: 'start' | 'status'
  selectedIds?: string[]
  filters?: ProductionDailyReportFilters
  jobId?: string
}

interface ProductionDailyReportExportJobRow {
  id: string
  requested_by_admin_employee_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  request_payload: {
    selectedIds?: string[]
    filters?: ProductionDailyReportFilters
  } | null
  file_name: string | null
  file_path: string | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
}

interface ProductionDailyReportItemRow {
  id: string
  data_category: ProductionOrderDataCategory | null
  project_no: string
  product_model: string | null
  customer_model: string | null
  incoming_qualified_quantity: number
  length_mm: number | null
  operation: string
  qualified_quantity: number
  qualified_hours: number | null
  defect_quantity_1: number
  defect_quantity_2: number
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  setup_defect_quantity: number
  setup_responsible: string | null
  remark: string | null
  production_orders: {
    order_date: string
    employee: {
      id: string
      name: string
    } | null
  }
}

interface SalesOrderWeightRow {
  project_no: string | null
  weight_per_meter_kg: number | null
}

const EXPORT_BUCKET = 'production-daily-report-exports'
const EXPORT_PAGE_SIZE = 1000
const EXPORT_PAGE_CONCURRENCY = 5
const EXPORT_SELECTED_IDS_BATCH_SIZE = 100
const EXPORT_SIGNED_URL_TTL_SECONDS = 60
const EXPORT_FILE_EXPIRE_HOURS = 24

function getExportStoragePath(
  requestedByAdminEmployeeId: string,
  jobId: string,
) {
  return `${requestedByAdminEmployeeId}/${jobId}/production-daily-report.xlsx`
}

const PRODUCTION_DAILY_REPORT_EXPORT_SELECT = `
  id,
  data_category,
  project_no,
  product_model,
  customer_model,
  incoming_qualified_quantity,
  length_mm,
  operation,
  qualified_quantity,
  qualified_hours,
  defect_quantity_1,
  defect_quantity_2,
  outsource_defect_quantity,
  outsource_defect_reason,
  outsource_unit,
  setup_defect_quantity,
  setup_responsible,
  remark,
  production_orders!inner(
    order_date,
    employee:employees(id, name)
  )
`

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function normalizeString(value?: string | null) {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function normalizeFilters(filters?: ProductionDailyReportFilters) {
  if (!filters) {
    return {} as ProductionDailyReportFilters
  }

  const productModel = Array.from(
    new Set(
      (filters.productModel || [])
        .map((item) => normalizeString(item))
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-CN'))

  return {
    startDate: normalizeString(filters.startDate),
    endDate: normalizeString(filters.endDate),
    dataCategory:
      filters.dataCategory === 'A' || filters.dataCategory === 'B'
        ? filters.dataCategory
        : undefined,
    projectNo: normalizeString(filters.projectNo),
    productModel: productModel.length > 0 ? productModel : undefined,
    customerModel: normalizeString(filters.customerModel),
    operation: normalizeString(filters.operation),
    employeeId: normalizeString(filters.employeeId),
  }
}

function normalizeSelectedIds(selectedIds?: string[]) {
  return Array.from(
    new Set(
      (selectedIds || []).map((id) => id.trim()).filter((id) => id.length > 0),
    ),
  )
}

function getExclusiveEndDate(endDate: string) {
  const date = new Date(`${endDate}T00:00:00`)
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function buildProductionDailyReportQuery(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  filters: ProductionDailyReportFilters,
  selectClause: string,
  withCount = false,
) {
  let query = adminClient
    .from('production_order_items')
    .select(selectClause, withCount ? { count: 'exact' } : undefined)

  if (filters.startDate) {
    query = query.gte('production_orders.order_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lt(
      'production_orders.order_date',
      getExclusiveEndDate(filters.endDate),
    )
  }

  if (filters.employeeId) {
    query = query.eq('production_orders.employee_id', filters.employeeId)
  }

  if (filters.projectNo) {
    query = query.ilike('project_no', `%${filters.projectNo}%`)
  }

  if (filters.dataCategory) {
    query = query.eq('data_category', filters.dataCategory)
  }

  if (filters.productModel?.length) {
    query = query.in('product_model', filters.productModel)
  }

  if (filters.customerModel) {
    query = query.ilike('customer_model', `%${filters.customerModel}%`)
  }

  if (filters.operation) {
    query = query.ilike('operation', `%${filters.operation}%`)
  }

  return query
}

function applyProductionDailyReportOrdering<
  TQuery extends ReturnType<typeof buildProductionDailyReportQuery>,
>(query: TQuery) {
  return query
    .order('order_date', {
      ascending: false,
      referencedTable: 'production_orders',
    })
    .order('project_no', { ascending: true })
    .order('operation', { ascending: true })
    .order('id', { ascending: true })
}

async function getProductionDailyReportItemsBatch(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  ids: string[],
) {
  const { data, error } = await adminClient
    .from('production_order_items')
    .select(PRODUCTION_DAILY_REPORT_EXPORT_SELECT)
    .in('id', ids)

  if (error) {
    throw new Error(`获取导出日报详情失败: ${error.message}`)
  }

  return (data || []) as unknown as ProductionDailyReportItemRow[]
}

async function getProductionDailyReportItems(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  ids: string[],
) {
  if (ids.length === 0) {
    return [] as ProductionDailyReportItemRow[]
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  const batches: string[][] = []

  for (
    let index = 0;
    index < uniqueIds.length;
    index += EXPORT_SELECTED_IDS_BATCH_SIZE
  ) {
    batches.push(uniqueIds.slice(index, index + EXPORT_SELECTED_IDS_BATCH_SIZE))
  }

  const rows = (
    await Promise.all(
      batches.map((batchIds) =>
        getProductionDailyReportItemsBatch(adminClient, batchIds),
      ),
    )
  ).flat()
  const rowMap = new Map(rows.map((row) => [row.id, row]))

  return uniqueIds
    .map((id) => rowMap.get(id))
    .filter((row): row is ProductionDailyReportItemRow => Boolean(row))
}

async function getProductionDailyReportItemsPageByFilters(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  {
    page,
    pageSize,
    filters,
  }: {
    page: number
    pageSize: number
    filters: ProductionDailyReportFilters
  },
) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await applyProductionDailyReportOrdering(
    buildProductionDailyReportQuery(
      adminClient,
      filters,
      PRODUCTION_DAILY_REPORT_EXPORT_SELECT,
      true,
    ),
  ).range(from, to)

  if (error) {
    throw new Error(`获取导出日报详情失败: ${error.message}`)
  }

  return {
    items: (data || []) as unknown as ProductionDailyReportItemRow[],
    total: count || 0,
  }
}

async function getProductionDailyReportItemsByFilters(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  filters: ProductionDailyReportFilters,
) {
  const firstPage = await getProductionDailyReportItemsPageByFilters(
    adminClient,
    {
      page: 1,
      pageSize: EXPORT_PAGE_SIZE,
      filters,
    },
  )

  const collectedItems = [...firstPage.items]

  if (firstPage.total <= collectedItems.length) {
    return collectedItems
  }

  const totalPages = Math.ceil(firstPage.total / EXPORT_PAGE_SIZE)
  const remainingPages = Array.from(
    { length: Math.max(totalPages - 1, 0) },
    (_, index) => index + 2,
  )

  for (
    let index = 0;
    index < remainingPages.length;
    index += EXPORT_PAGE_CONCURRENCY
  ) {
    const pageChunk = remainingPages.slice(
      index,
      index + EXPORT_PAGE_CONCURRENCY,
    )
    const pageResults = await Promise.all(
      pageChunk.map((page) =>
        getProductionDailyReportItemsPageByFilters(adminClient, {
          page,
          pageSize: EXPORT_PAGE_SIZE,
          filters,
        }),
      ),
    )

    pageResults.forEach((result) => {
      collectedItems.push(...result.items)
    })
  }

  return collectedItems
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function getProjectWeightMap(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  projectNos: string[],
) {
  const weightMap = new Map<string, number>()
  const uniqueProjectNos = Array.from(new Set(projectNos.filter(Boolean)))

  if (uniqueProjectNos.length === 0) {
    return weightMap
  }

  for (const chunk of chunkArray(uniqueProjectNos, EXPORT_PAGE_SIZE)) {
    const { data, error } = await adminClient
      .from('sales_orders')
      .select('project_no, weight_per_meter_kg')
      .in('project_no', chunk)

    if (error) {
      throw new Error(`获取项目比重失败: ${error.message}`)
    }

    ;((data || []) as SalesOrderWeightRow[]).forEach((item) => {
      if (item.project_no) {
        weightMap.set(item.project_no, Number(item.weight_per_meter_kg || 0))
      }
    })
  }

  return weightMap
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function calculateQualifiedRate(
  qualifiedCount: number,
  incomingQualifiedCount: number,
) {
  if (incomingQualifiedCount <= 0) {
    return 0
  }

  return roundTo(qualifiedCount / incomingQualifiedCount, 4)
}

async function buildProductionDailyReportRows(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  items: ProductionDailyReportItemRow[],
) {
  const weightMap = await getProjectWeightMap(
    adminClient,
    items.map((item) => item.project_no),
  )

  return items
    .map((item) => {
      const employeeName = item.production_orders.employee?.name || '-'
      const normalizedOperation = item.operation.trim() || '未分类'
      const incomingQualifiedCount = Number(
        item.incoming_qualified_quantity || 0,
      )
      const rawMaterialDefectCount = Number(item.defect_quantity_2 || 0)
      const processingDefectCount = Number(item.defect_quantity_1 || 0)
      const outsourceDefectCount = Number(item.outsource_defect_quantity || 0)
      const setupDefectCount = Number(item.setup_defect_quantity || 0)
      const qualifiedCount = Number(item.qualified_quantity || 0)
      const defectCount =
        rawMaterialDefectCount +
        processingDefectCount +
        outsourceDefectCount +
        setupDefectCount
      const weightPerMeterKg = weightMap.get(item.project_no) || 0
      const lengthMm = Number(item.length_mm || 0)

      return {
        key: item.id,
        orderDate: item.production_orders.order_date,
        dataCategory: item.data_category || 'A',
        projectNo: item.project_no,
        productModel: item.product_model || '-',
        customerModel: item.customer_model || '-',
        incomingQualifiedCount,
        lengthMm: item.length_mm,
        operation: normalizedOperation,
        qualifiedCount,
        defectCount,
        workHours: roundTo(Number(item.qualified_hours || 0)),
        employeeName,
        rawMaterialDefectCount,
        processingDefectCount,
        outsourceDefectCount,
        outsourceDefectReason: item.outsource_defect_reason?.trim() || '-',
        outsourceUnit: item.outsource_unit?.trim() || '-',
        setupDefectCount,
        setupResponsible: item.setup_responsible?.trim() || '-',
        qualifiedRate: calculateQualifiedRate(
          qualifiedCount,
          incomingQualifiedCount,
        ),
        rawMaterialDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * rawMaterialDefectCount) / 1000,
        ),
        processingDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * processingDefectCount) / 1000,
        ),
        outsourceDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * outsourceDefectCount) / 1000,
        ),
        setupDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * setupDefectCount) / 1000,
        ),
        remark: item.remark?.trim() || '-',
      } satisfies ProductionDailyReportExportRow
    })
    .sort((left, right) => {
      const dateCompare = right.orderDate.localeCompare(left.orderDate)

      if (dateCompare !== 0) {
        return dateCompare
      }

      const projectCompare = left.projectNo.localeCompare(
        right.projectNo,
        'zh-CN',
      )

      if (projectCompare !== 0) {
        return projectCompare
      }

      return left.operation.localeCompare(right.operation, 'zh-CN')
    })
}

async function updateJob(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  jobId: string,
  values: Record<string, unknown>,
) {
  const { error } = await adminClient
    .from('production_daily_report_export_jobs')
    .update(values)
    .eq('id', jobId)

  if (error) {
    throw new Error(`更新导出任务失败: ${error.message}`)
  }
}

async function processExportJob({
  adminClient,
  jobId,
  selectedIds,
  filters,
  fileName,
  requestedByAdminEmployeeId,
}: {
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient']
  jobId: string
  selectedIds: string[]
  filters: ProductionDailyReportFilters
  fileName: string
  requestedByAdminEmployeeId: string
}) {
  try {
    await updateJob(adminClient, jobId, {
      status: 'processing',
      started_at: new Date().toISOString(),
      error_message: null,
    })

    const items =
      selectedIds.length > 0
        ? await getProductionDailyReportItems(adminClient, selectedIds)
        : await getProductionDailyReportItemsByFilters(adminClient, filters)

    if (items.length === 0) {
      throw new Error('当前没有可导出的日报数据')
    }

    const rows = await buildProductionDailyReportRows(adminClient, items)
    const buffer = buildProductionDailyReportExcelBuffer(rows)
    const filePath = getExportStoragePath(requestedByAdminEmployeeId, jobId)

    const { error: uploadError } = await adminClient.storage
      .from(EXPORT_BUCKET)
      .upload(filePath, new Uint8Array(buffer), {
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`上传导出文件失败: ${uploadError.message}`)
    }

    const completedAt = new Date()
    const expiresAt = new Date(
      completedAt.getTime() + EXPORT_FILE_EXPIRE_HOURS * 60 * 60 * 1000,
    )

    await updateJob(adminClient, jobId, {
      status: 'completed',
      file_name: fileName,
      file_path: filePath,
      completed_at: completedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      error_message: null,
    })
  } catch (error) {
    await updateJob(adminClient, jobId, {
      status: 'failed',
      error_message:
        error instanceof Error ? error.message.slice(0, 500) : '导出失败',
      completed_at: new Date().toISOString(),
    })
  }
}

async function handleStart(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  adminEmployee: Awaited<ReturnType<typeof assertAdmin>>['adminEmployee'],
  payload: StartExportPayload,
) {
  const selectedIds = normalizeSelectedIds(payload.selectedIds)
  const filters = normalizeFilters(payload.filters)
  const fileName = getProductionDailyReportExportFilename()

  const { data, error } = await adminClient
    .from('production_daily_report_export_jobs')
    .insert({
      requested_by_admin_employee_id: adminEmployee.id,
      status: 'pending',
      request_payload: {
        selectedIds,
        filters,
      },
      file_name: fileName,
    })
    .select('id')
    .single()

  if (error || !data?.id) {
    return jsonResponse({ error: '创建导出任务失败' }, 500)
  }

  EdgeRuntime.waitUntil(
    processExportJob({
      adminClient,
      jobId: data.id,
      selectedIds,
      filters,
      fileName,
      requestedByAdminEmployeeId: adminEmployee.id,
    }),
  )

  return jsonResponse({
    jobId: data.id,
    status: 'pending',
  })
}

async function handleStatus(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  adminEmployee: Awaited<ReturnType<typeof assertAdmin>>['adminEmployee'],
  jobId?: string,
) {
  const normalizedJobId = normalizeString(jobId)

  if (!normalizedJobId) {
    return jsonResponse({ error: '导出任务 ID 不能为空' }, 400)
  }

  const { data, error } = await adminClient
    .from('production_daily_report_export_jobs')
    .select(
      'id, requested_by_admin_employee_id, status, request_payload, file_name, file_path, error_message, created_at, started_at, completed_at, expires_at',
    )
    .eq('id', normalizedJobId)
    .eq('requested_by_admin_employee_id', adminEmployee.id)
    .maybeSingle()

  if (error) {
    return jsonResponse({ error: '读取导出任务失败' }, 500)
  }

  if (!data) {
    return jsonResponse({ error: '导出任务不存在' }, 404)
  }

  let downloadUrl: string | undefined

  if (data.status === 'completed' && data.file_path) {
    const { data: signedData, error: signedError } = await adminClient.storage
      .from(EXPORT_BUCKET)
      .createSignedUrl(data.file_path, EXPORT_SIGNED_URL_TTL_SECONDS, {
        download: data.file_name || undefined,
      })

    if (signedError) {
      return jsonResponse({ error: '生成下载链接失败' }, 500)
    }

    downloadUrl = signedData.signedUrl
  }

  return jsonResponse({
    job: {
      ...(data as ProductionDailyReportExportJobRow),
      downloadUrl,
    },
  })
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authorization = request.headers.get('Authorization')

  if (!authorization) {
    return jsonResponse({ error: '未登录，无法导出生产日报' }, 401)
  }

  let adminClient
  let adminEmployee

  try {
    ;({ adminClient, adminEmployee } = await assertAdmin(authorization))
  } catch (error) {
    const message = error instanceof Error ? error.message : '权限校验失败'
    const status = message.includes('登录状态') ? 401 : 403
    return jsonResponse({ error: message }, status)
  }

  let payload: StartExportPayload

  try {
    payload = await request.json()
  } catch {
    return jsonResponse({ error: '请求体格式不正确' }, 400)
  }

  if (payload.action === 'status') {
    return handleStatus(adminClient, adminEmployee, payload.jobId)
  }

  return handleStart(adminClient, adminEmployee, payload)
})
