import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

import { assertAdmin } from '../_shared/admin.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  buildProductionOrderExcelBuffer,
  getProductionOrderExportFilename,
  type ProductionOrderForExportRecord,
} from '../_shared/production-order-export-workbook.ts'

type ProductionOrderShift = '白班' | '夜班'
type ProductionOrderDataCategory = 'A' | 'B'

interface ProductionOrderExportFilters {
  startDate?: string
  endDate?: string
  employeeId?: string
  shift?: ProductionOrderShift
  dataCategory?: ProductionOrderDataCategory
  productModel?: string
  customerModel?: string
  isAudited?: boolean
}

interface StartExportPayload {
  action?: 'start' | 'status'
  selectedIds?: string[]
  filters?: ProductionOrderExportFilters
  jobId?: string
}

interface ProductionOrderExportJobRow {
  id: string
  requested_by_admin_employee_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  request_payload: {
    selectedIds?: string[]
    filters?: ProductionOrderExportFilters
  } | null
  file_name: string | null
  file_path: string | null
  error_message: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  expires_at: string | null
}

const EXPORT_BUCKET = 'production-order-exports'
const EXPORT_PAGE_SIZE = 1000
const EXPORT_PAGE_CONCURRENCY = 5
const EXPORT_SIGNED_URL_TTL_SECONDS = 60
const EXPORT_FILE_EXPIRE_HOURS = 24

const PRODUCTION_ORDER_EXPORT_SELECT = `
  id,
  created_at,
  order_date,
  work_hours,
  extra_qualified_hours,
  total_qualified_hours,
  efficiency,
  shift,
  remark,
  employee:employees(id, name, job_name, hourly_wage, coefficient),
  items:production_order_items(
    id,
    data_category,
    project_no,
    product_model,
    customer_model,
    length_mm,
    operation,
    standard_seconds,
    incoming_qualified_quantity,
    qualified_quantity,
    qualified_hours,
    defect_quantity_1,
    defect_quantity_2,
    defect_hours,
    remark
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

function normalizeFilters(filters?: ProductionOrderExportFilters) {
  if (!filters) {
    return {} as ProductionOrderExportFilters
  }

  return {
    startDate: normalizeString(filters.startDate),
    endDate: normalizeString(filters.endDate),
    employeeId: normalizeString(filters.employeeId),
    shift:
      filters.shift === '白班' || filters.shift === '夜班'
        ? filters.shift
        : undefined,
    dataCategory:
      filters.dataCategory === 'A' || filters.dataCategory === 'B'
        ? filters.dataCategory
        : undefined,
    productModel: normalizeString(filters.productModel),
    customerModel: normalizeString(filters.customerModel),
    isAudited:
      typeof filters.isAudited === 'boolean' ? filters.isAudited : undefined,
  }
}

function normalizeSelectedIds(selectedIds?: string[]) {
  return Array.from(
    new Set(
      (selectedIds || []).map((id) => id.trim()).filter((id) => id.length > 0),
    ),
  )
}

async function getProductionOrderIdsPageByFilters(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  {
    page,
    pageSize,
    filters,
  }: {
    page: number
    pageSize: number
    filters: ProductionOrderExportFilters
  },
) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const hasItemFilters = Boolean(
    filters.dataCategory || filters.productModel || filters.customerModel,
  )

  let query = adminClient
    .from('production_orders')
    .select(
      `
      id${hasItemFilters ? ',\n      item_filters:production_order_items!inner(id, data_category, product_model, customer_model)' : ''}
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .order('order_date', { ascending: false })

  if (filters.startDate) {
    query = query.gte('order_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('order_date', filters.endDate)
  }

  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId)
  }

  if (filters.shift) {
    query = query.eq('shift', filters.shift)
  }

  if (filters.dataCategory) {
    query = query.eq('item_filters.data_category', filters.dataCategory)
  }

  if (typeof filters.isAudited === 'boolean') {
    query = query.eq('is_audited', filters.isAudited)
  }

  if (filters.productModel) {
    query = query.ilike(
      'item_filters.product_model',
      `%${filters.productModel}%`,
    )
  }

  if (filters.customerModel) {
    query = query.ilike(
      'item_filters.customer_model',
      `%${filters.customerModel}%`,
    )
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取导出工单 ID 失败: ${error.message}`)
  }

  return {
    ids: ((data || []) as Array<{ id: string }>).map((item) => item.id),
    total: count || 0,
  }
}

async function getProductionOrderIdsByFilters(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  filters: ProductionOrderExportFilters,
) {
  const firstPage = await getProductionOrderIdsPageByFilters(adminClient, {
    page: 1,
    pageSize: EXPORT_PAGE_SIZE,
    filters,
  })

  const collectedIds = [...firstPage.ids]

  if (firstPage.total <= collectedIds.length) {
    return collectedIds
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
        getProductionOrderIdsPageByFilters(adminClient, {
          page,
          pageSize: EXPORT_PAGE_SIZE,
          filters,
        }),
      ),
    )

    pageResults.forEach((result) => {
      collectedIds.push(...result.ids)
    })
  }

  return collectedIds
}

async function getProductionOrdersForExportBatch(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  ids: string[],
) {
  const { data, error } = await adminClient
    .from('production_orders')
    .select(PRODUCTION_ORDER_EXPORT_SELECT)
    .in('id', ids)

  if (error) {
    throw new Error(`获取导出工单详情失败: ${error.message}`)
  }

  return (data || []) as ProductionOrderForExportRecord[]
}

async function getProductionOrdersForExport(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  ids: string[],
) {
  if (ids.length === 0) {
    return [] as ProductionOrderForExportRecord[]
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  const batches: string[][] = []

  for (let index = 0; index < uniqueIds.length; index += 200) {
    batches.push(uniqueIds.slice(index, index + 200))
  }

  const rows = (
    await Promise.all(
      batches.map((batchIds) =>
        getProductionOrdersForExportBatch(adminClient, batchIds),
      ),
    )
  ).flat()
  const rowMap = new Map(rows.map((row) => [row.id, row]))

  return uniqueIds
    .map((id) => rowMap.get(id))
    .filter((row): row is ProductionOrderForExportRecord => Boolean(row))
    .sort((left, right) => {
      const dateCompare = left.order_date.localeCompare(right.order_date)

      if (dateCompare !== 0) {
        return dateCompare
      }

      return left.created_at.localeCompare(right.created_at)
    })
}

async function updateJob(
  adminClient: Awaited<ReturnType<typeof assertAdmin>>['adminClient'],
  jobId: string,
  values: Record<string, unknown>,
) {
  const { error } = await adminClient
    .from('production_order_export_jobs')
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
  filters: ProductionOrderExportFilters
  fileName: string
  requestedByAdminEmployeeId: string
}) {
  try {
    await updateJob(adminClient, jobId, {
      status: 'processing',
      started_at: new Date().toISOString(),
      error_message: null,
    })

    const targetIds =
      selectedIds.length > 0
        ? selectedIds
        : await getProductionOrderIdsByFilters(adminClient, filters)

    if (targetIds.length === 0) {
      throw new Error('当前没有可导出的工单')
    }

    const orders = await getProductionOrdersForExport(adminClient, targetIds)
    const buffer = buildProductionOrderExcelBuffer(orders)
    const filePath = `${requestedByAdminEmployeeId}/${jobId}/${fileName}`

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
  const fileName = getProductionOrderExportFilename()

  const { data, error } = await adminClient
    .from('production_order_export_jobs')
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
    .from('production_order_export_jobs')
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
      ...(data as ProductionOrderExportJobRow),
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
    return jsonResponse({ error: '未登录，无法导出工单' }, 401)
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
