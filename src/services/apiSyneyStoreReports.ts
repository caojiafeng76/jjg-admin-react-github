import { ISyneyItem } from './types'
import { FunctionRegion } from '@supabase/supabase-js'
import supabase from '@services/supabase'
import { handleApiError } from '@utils/errorHandler'
import { resolveSyneyStoreReportProxyUrl } from './syneyStoreReportProxy'

const FETCH_SYNEY_STORE_REPORT_TIMEOUT_MS = 45000
const SYNEY_STORE_REPORT_API_URL = import.meta.env
  .VITE_SYNEY_STORE_REPORT_API_URL as string | undefined
const SYNEY_STORE_REPORT_FUNCTION_REGION = import.meta.env
  .VITE_SUPABASE_FUNCTION_REGION as string | undefined

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

async function getFunctionErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object' || !('context' in error)) {
    return null
  }

  const context = (error as { context?: Response }).context
  if (!context) {
    return null
  }

  try {
    const body = (await context.clone().json()) as { error?: string }
    return body.error || null
  } catch {
    return null
  }
}

function getFunctionRegion() {
  const region = SYNEY_STORE_REPORT_FUNCTION_REGION?.trim()
  if (!region) {
    return undefined
  }

  if (!Object.values(FunctionRegion).includes(region as FunctionRegion)) {
    throw new Error(`Supabase Edge Function 区域配置不正确：${region}`)
  }

  return region as FunctionRegion
}

function isBrowserFetchFailure(error: unknown) {
  return (
    error instanceof TypeError &&
    /failed to fetch|fetch failed|network/i.test(error.message)
  )
}

async function invokeSyneyStoreReportFunction(storeInNo: string) {
  const region = getFunctionRegion()

  let result: Awaited<
    ReturnType<
      typeof supabase.functions.invoke<{
        storeInNo: string
        total: number
        items: ISyneyItem[]
        error?: string
      }>
    >
  >

  try {
    result = await withTimeout(
      supabase.functions.invoke<{
        storeInNo: string
        total: number
        items: ISyneyItem[]
        error?: string
      }>('fetch-syney-store-report', {
        body: { storeInNo },
        ...(region ? { region } : {}),
      }),
      FETCH_SYNEY_STORE_REPORT_TIMEOUT_MS,
      '西尼入库单获取超时，请稍后重试或检查 SCM 网络',
    )
  } catch (error) {
    if (isBrowserFetchFailure(error)) {
      throw new Error('西尼入库单云函数连接失败，请检查网络或 Supabase 函数配置', {
        cause: error,
      })
    }

    throw error
  }

  const { data, error } = result

  if (error) {
    const functionErrorMessage = await getFunctionErrorMessage(error)
    if (functionErrorMessage) {
      throw new Error(functionErrorMessage)
    }

    throw handleApiError(error, '西尼入库单获取失败')
  }

  if (!data) {
    throw new Error('西尼入库单获取失败')
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data.items
}

export async function fetchSyneyStoreReportFromScm(storeInNo: string) {
  const configuredProxyUrl = SYNEY_STORE_REPORT_API_URL?.trim()
  const proxyUrl = resolveSyneyStoreReportProxyUrl({
    configuredProxyUrl,
    isDev: import.meta.env.DEV,
  })

  if (!proxyUrl) {
    return invokeSyneyStoreReportFunction(storeInNo)
  }

  let response: Response

  try {
    response = await withTimeout(
      fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeInNo }),
      }),
      FETCH_SYNEY_STORE_REPORT_TIMEOUT_MS,
      '西尼入库单获取超时，请稍后重试或检查 SCM 网络',
    )
  } catch (error) {
    if (isBrowserFetchFailure(error)) {
      throw new Error('西尼入库单代理接口连接失败，请检查代理地址或开发服务器', {
        cause: error,
      })
    }

    throw error
  }

  if (response.status === 404 && configuredProxyUrl) {
    throw new Error('西尼入库单代理接口不存在，请检查代理地址配置')
  }

  if (response.status !== 404) {
    const contentType = response.headers.get('content-type') || ''

    if (!contentType.includes('application/json')) {
      throw new Error('西尼入库单代理接口未返回 JSON，请检查代理地址配置')
    }

    const proxyData = (await response.json()) as {
      items?: ISyneyItem[]
      error?: string
    }

    if (!response.ok || proxyData.error) {
      throw new Error(proxyData.error || '西尼入库单获取失败')
    }

    return proxyData.items || []
  }

  return invokeSyneyStoreReportFunction(storeInNo)
}

export async function getSyneyStoreReports({
  status,
  page,
  pageSize,
}: {
  status: string
  page: number
  pageSize: number
}) {
  let query = supabase
    .from('syney-store-reports')
    // 只选择列表页需要的字段，不要查询 Detail 字段！
    .select('id, No, Status, TotalAmount, created_at', { count: 'exact' })
    .range(pageSize * (page - 1), pageSize * page - 1)
    .order('created_at', { ascending: false })
    .order('No')

  if (status !== 'all') {
    query = query.eq('Status', status)
  }

  const { data: syneyStoreReports, error, count } = await query

  if (error) {
    throw handleApiError(error, '入库单列表获取失败')
  }

  return { syneyStoreReports, count }
}

export async function getSyneyStoreReport(No: string) {
  const { data: syneyStoreReport, error } = await supabase
    .from('syney-store-report-items')
    .select('*')
    .eq('No', No)
    .order('PartNo')

  if (error) {
    throw handleApiError(error, '入库单详情获取失败')
  }

  return syneyStoreReport
}

export async function getSelectedSyneyStoreReports(Nos: string[]) {
  // 使用 Promise.all 并行查询，提升性能
  const [itemsResult, reportsResult] = await Promise.all([
    supabase
      .from('syney-store-report-items')
      .select('*')
      .in('No', Nos)
      .order('No'),
    supabase
      .from('syney-store-reports')
      .select('*')
      .in('No', Nos)
  ])

  const { data: itemsFromRepo, error: itemsError } = itemsResult
  const { data: reports, error: reportsError } = reportsResult

  if (itemsError) {
    throw handleApiError(itemsError, '选择的入库单获取失败')
  }

  if (reportsError) {
    throw handleApiError(reportsError, '选择的入库单获取失败')
  }

  // 使用 Map 提升查找性能，避免重复过滤和查找
  const reportsMap = new Map(
    reports?.map(report => [report.No, report])
  )

  const itemsGroupMap = new Map<string, ISyneyItem[]>()

  // 一次性分组，提升性能
  itemsFromRepo?.forEach(item => {
    const items = itemsGroupMap.get(item.No || '') || []
    items.push(item)
    itemsGroupMap.set(item.No || '', items)
  })

  // 构建最终结果Map
  const result = new Map<
    string,
    { items: ISyneyItem[]; totalAmount: number; createdAt: string }
  >()

  Nos.forEach(No => {
    const items = itemsGroupMap.get(No) || []
    const report = reportsMap.get(No)

    result.set(No, {
      items,
      totalAmount: report?.TotalAmount ?? 0,
      createdAt: report?.created_at ?? '',
    })
  })

  return result
}

export async function createSyneyStoreReport({
  No,
  TotalAmount,
  items,
}: {
  No: string
  TotalAmount: number
  items: ISyneyItem[]
}) {
  const { data: syneyStoreReportFormRepo, error: reportError } = await supabase
    .from('syney-store-reports')
    .insert([{ No, TotalAmount }])
    .select('No')
    .single()

  if (reportError) {
    throw handleApiError(reportError, '入库单创建失败')
  }

  // 过滤掉数据库中不存在的字段（PartCode、PartModel、PartName2）
  const filteredItems = items.map((item) => ({
    No: item.No,
    ParamSpec: item.ParamSpec,
    PartName: item.PartName,
    PartNo: item.PartNo,
    Qty: item.Qty,
    Remark: item.Remark,
    SONo: item.SONo,
    Spec: item.Spec,
    TaxTotalPrice: item.TaxTotalPrice,
    TaxUnitPrice: item.TaxUnitPrice,
    Unit: item.Unit,
  }))

  const { data, error } = await supabase
    .from('syney-store-report-items')
    .insert(filteredItems)
    .select()

  if (error) {
    await supabase
      .from('syney-store-reports')
      .delete()
      .eq('No', syneyStoreReportFormRepo.No)
    throw handleApiError(error, '入库单明细创建失败')
  }

  return data
}

export async function deleteSyneyStoreReport(Nos: string[]) {
  const { error } = await supabase
    .from('syney-store-reports')
    .delete()
    .in('No', Nos)

  if (error) {
    throw handleApiError(error, '入库单删除失败')
  }
}

export async function updateSyneyStoreReports({
  Nos,
  Status,
}: {
  Nos: string[]
  Status: string
}) {
  const { error } = await supabase
    .from('syney-store-reports')
    .update({ Status })
    .in('No', Nos)

  if (error) {
    throw handleApiError(error, '入库单状态更新失败')
  }
}
