import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { Database } from './database.types'

export type ProcessStandard =
  Database['public']['Tables']['process_standards']['Row']
export type ProcessStandardMatchLevel = 'type-a' | 'type-b'

export interface ProcessStandardMatchResult<T> {
  records: T[]
  matchLevel: ProcessStandardMatchLevel | null
}

type ProcessStandardStandardSeconds = Pick<ProcessStandard, 'standard_seconds'>
interface ProcessStandardMatchParams {
  model: string
  length?: number | null
  partNo?: string | null
  operation?: string
}
type SalesOrderRow = Database['public']['Tables']['sales_orders']['Row']
export type SalesOrderProjectNoOption = Pick<
  SalesOrderRow,
  | 'project_no'
  | 'product_model'
  | 'length_mm'
  | 'material_code'
  | 'customer'
  | 'customer_model'
  | 'created_at'
> & {
  project_no: string
}
type SalesOrderProjectNoDetail = Pick<
  SalesOrderRow,
  | 'project_no'
  | 'product_model'
  | 'length_mm'
  | 'material_code'
  | 'customer'
  | 'customer_model'
> & {
  project_no: string
}

function normalizeMatchText(value: string | null | undefined) {
  return value?.trim() || null
}

function normalizeMatchLength(value: number | null | undefined) {
  const normalizedValue = Number(value)

  if (!Number.isFinite(normalizedValue) || normalizedValue <= 0) {
    return null
  }

  return normalizedValue
}

// === 标准秒模块级缓存 ===
// process_standards 为低变更基础数据：TTL 1h（与 queryConfig.static 语义一致）；
// 写入口（apiStandardTimes 增删改标准秒/匹配字段）通过 clearStandardSecondsCache() 主动失效
const STANDARD_SECONDS_CACHE_TTL_MS = 60 * 60 * 1000
const MAX_STANDARD_SECONDS_CACHE_ENTRIES = 1000

interface StandardSecondsCacheEntry {
  expiresAt: number
  seconds: number
}

const standardSecondsCache = new Map<string, StandardSecondsCacheEntry>()

export function clearStandardSecondsCache() {
  standardSecondsCache.clear()
}

function getCachedStandardSeconds(cacheKey: string): number | undefined {
  const entry = standardSecondsCache.get(cacheKey)

  if (!entry) {
    return undefined
  }

  if (Date.now() > entry.expiresAt) {
    standardSecondsCache.delete(cacheKey)
    return undefined
  }

  return entry.seconds
}

function setCachedStandardSeconds(cacheKey: string, seconds: number) {
  if (standardSecondsCache.size >= MAX_STANDARD_SECONDS_CACHE_ENTRIES) {
    standardSecondsCache.clear()
  }

  standardSecondsCache.set(cacheKey, {
    expiresAt: Date.now() + STANDARD_SECONDS_CACHE_TTL_MS,
    seconds,
  })
}

function buildStandardSecondsCacheKey({
  model,
  operation,
  length,
  partNo,
}: ProcessStandardMatchParams) {
  return [
    normalizeMatchText(model) ?? '',
    normalizeMatchText(operation) ?? '',
    String(normalizeMatchLength(length) ?? ''),
    normalizeMatchText(partNo) ?? '',
  ].join('::')
}

async function fetchMatchedProcessStandards({
  model,
  length,
  partNo,
  operation,
  select,
}: ProcessStandardMatchParams & {
  select: '*' | 'standard_seconds'
}): Promise<
  ProcessStandardMatchResult<ProcessStandard | ProcessStandardStandardSeconds>
> {
  const normalizedModel = normalizeMatchText(model)

  if (!normalizedModel) {
    return {
      records: [],
      matchLevel: null,
    }
  }

  const normalizedLength = normalizeMatchLength(length)
  const normalizedPartNo = normalizeMatchText(partNo)
  const normalizedOperation = normalizeMatchText(operation)

  const buildBaseQuery = () => {
    let query = supabase
      .from('process_standards')
      .select(select)
      .eq('model', normalizedModel)

    if (normalizedOperation) {
      query = query.eq('operation', normalizedOperation)
    }

    return query
  }

  // A 类型：按料号 + 型号 + 长度精确匹配
  if (normalizedPartNo && normalizedLength !== null) {
    const { data, error } = await buildBaseQuery()
      .eq('record_type', 'A')
      .eq('part_no', normalizedPartNo)
      .eq('length', normalizedLength)
      .order('operation', { ascending: true })

    if (error) {
      throw handleApiError(error, '获取成本核算匹配数据失败')
    }

    if ((data || []).length > 0) {
      return {
        records: (data || []) as Array<
          ProcessStandard | ProcessStandardStandardSeconds
        >,
        matchLevel: 'type-a',
      }
    }
  }

  // B 类型：仅按型号匹配
  const { data, error } = await buildBaseQuery()
    .eq('record_type', 'B')
    .order('operation', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取成本核算匹配数据失败')
  }

  if ((data || []).length > 0) {
    return {
      records: (data || []) as Array<
        ProcessStandard | ProcessStandardStandardSeconds
      >,
      matchLevel: 'type-b',
    }
  }

  return {
    records: [],
    matchLevel: null,
  }
}

export async function getOperationsByModel({
  model,
  length,
  partNo,
}: ProcessStandardMatchParams) {
  const result = await fetchMatchedProcessStandards({
    model,
    length,
    partNo,
    select: '*',
  })

  return {
    records: result.records as ProcessStandard[],
    matchLevel: result.matchLevel,
  }
}

export async function getStandardSeconds({
  model,
  operation,
  length,
  partNo,
}: ProcessStandardMatchParams) {
  const cacheKey = buildStandardSecondsCacheKey({
    model,
    operation,
    length,
    partNo,
  })
  const cachedSeconds = getCachedStandardSeconds(cacheKey)

  if (cachedSeconds !== undefined) {
    return cachedSeconds
  }

  const result = await fetchMatchedProcessStandards({
    model,
    operation,
    length,
    partNo,
    select: 'standard_seconds',
  })

  const seconds =
    (result.records[0] as ProcessStandardStandardSeconds | undefined)
      ?.standard_seconds ?? 0

  setCachedStandardSeconds(cacheKey, seconds)
  return seconds
}

export async function getModels() {
  const { data, error } = await supabase
    .from('process_standards')
    .select('model')
    .order('model', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取型号列表失败')
  }

  const uniqueModels = Array.from(
    new Set((data || []).map((item) => item.model)),
  )
  return uniqueModels as string[]
}

// PostgREST 默认 db-max-rows 为 1000，单次查询会截断生产中订单选项，
// 必须按 1000 一页循环拉取（同 apiMaterialTransfers 的分页模式）
const SALES_ORDER_OPTIONS_PAGE_SIZE = 1000

export async function getSalesOrdersProjectNos() {
  const projectNos = new Set<string>()
  const options: SalesOrderProjectNoOption[] = []
  let from = 0

  while (true) {
    const to = from + SALES_ORDER_OPTIONS_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('v_sales_order_project_options')
      .select(
        'project_no, product_model, length_mm, material_code, customer, customer_model, created_at',
      )
      .eq('status', '生产中')
      .order('created_at', { ascending: false })
      .order('project_no', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取项目号列表失败')
    }

    for (const item of data || []) {
      if (!item.project_no || projectNos.has(item.project_no)) {
        continue
      }

      projectNos.add(item.project_no)
      options.push(item as SalesOrderProjectNoOption)
    }

    if ((data || []).length < SALES_ORDER_OPTIONS_PAGE_SIZE) break
    from += SALES_ORDER_OPTIONS_PAGE_SIZE
  }

  return options
}

export async function getSalesOrderByProjectNo(projectNo: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      'project_no, product_model, length_mm, material_code, customer, customer_model',
    )
    .eq('project_no', projectNo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取销售订单信息失败')
  }

  if (!data?.project_no) {
    throw new Error('销售订单项目号不存在')
  }

  return data as SalesOrderProjectNoDetail
}

export interface StandardSecondsResolveRequest {
  model: string
  operation: string
  length?: number | null
  partNo?: string | null
}

type StandardSecondsCandidateRow = {
  record_type: string | null
  part_no: string | null
  length: number | null
  standard_seconds: number
}

// 与 fetchMatchedProcessStandards 的 SQL 匹配口径保持一致：
// A 类型需料号+长度同时非空且精确匹配；否则回退 B 类型取首行（预取查询已按 operation 过滤，行内 operation 均一致）
function matchStandardSeconds(
  rows: StandardSecondsCandidateRow[],
  { length, partNo }: { length?: number | null; partNo?: string | null },
): number {
  const normalizedLength = normalizeMatchLength(length)
  const normalizedPartNo = normalizeMatchText(partNo)

  if (normalizedPartNo && normalizedLength !== null) {
    const typeARow = rows.find(
      (row) =>
        row.record_type === 'A' &&
        row.part_no === normalizedPartNo &&
        row.length === normalizedLength,
    )

    if (typeARow) {
      return typeARow.standard_seconds
    }
  }

  const typeBRow = rows.find((row) => row.record_type === 'B')
  return typeBRow?.standard_seconds ?? 0
}

/**
 * 批量解析标准秒：按 (model, operation) 组合去重后一次 in() 预取全部 A/B 候选行，
 * 在 JS 内按与 getStandardSeconds 相同的口径匹配，结果写入模块级缓存。
 * 批量预取失败时整体静默降级为 0（与原先逐组 try/catch 静默语义一致），不写缓存。
 */
export async function resolveStandardSecondsBatch(
  requests: StandardSecondsResolveRequest[],
): Promise<number[]> {
  const results = new Array<number>(requests.length)
  const missing: Array<{
    index: number
    cacheKey: string
    request: StandardSecondsResolveRequest
  }> = []

  requests.forEach((request, index) => {
    const cacheKey = buildStandardSecondsCacheKey(request)
    const cachedSeconds = getCachedStandardSeconds(cacheKey)

    if (cachedSeconds !== undefined) {
      results[index] = cachedSeconds
      return
    }

    if (!normalizeMatchText(request.model)) {
      results[index] = 0
      setCachedStandardSeconds(cacheKey, 0)
      return
    }

    missing.push({ index, cacheKey, request })
  })

  if (missing.length === 0) {
    return results
  }

  const combos = new Map<string, { model: string; operation: string }>()
  for (const { request } of missing) {
    const model = normalizeMatchText(request.model) ?? ''
    const operation = normalizeMatchText(request.operation) ?? ''
    combos.set(`${model}::${operation}`, { model, operation })
  }
  const comboList = Array.from(combos.values())

  const { data, error } = await supabase
    .from('process_standards')
    .select('model, operation, record_type, part_no, length, standard_seconds')
    .in(
      'model',
      comboList.map((combo) => combo.model),
    )
    .in(
      'operation',
      comboList.map((combo) => combo.operation),
    )
    .in('record_type', ['A', 'B'])

  if (error) {
    for (const { index } of missing) {
      results[index] = 0
    }
    return results
  }

  const rowsByCombo = new Map<string, StandardSecondsCandidateRow[]>()
  for (const row of data || []) {
    const comboKey = `${row.model}::${row.operation ?? ''}`
    const rows = rowsByCombo.get(comboKey) ?? []
    rows.push(row)
    rowsByCombo.set(comboKey, rows)
  }

  for (const { index, cacheKey, request } of missing) {
    const comboKey = `${normalizeMatchText(request.model) ?? ''}::${normalizeMatchText(request.operation) ?? ''}`
    const seconds = matchStandardSeconds(rowsByCombo.get(comboKey) ?? [], {
      length: request.length,
      partNo: request.partNo,
    })
    results[index] = seconds
    setCachedStandardSeconds(cacheKey, seconds)
  }

  return results
}
