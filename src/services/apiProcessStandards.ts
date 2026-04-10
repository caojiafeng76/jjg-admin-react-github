import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { Database } from './database.types'

export type ProcessStandard =
  Database['public']['Tables']['process_standards']['Row']
export type ProcessStandardMatchLevel =
  | 'type-a'
  | 'type-b'

export interface ProcessStandardMatchResult<T> {
  records: T[]
  matchLevel: ProcessStandardMatchLevel | null
}

type ProcessStandardStandardSeconds = Pick<
  ProcessStandard,
  'standard_seconds'
>
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

async function fetchMatchedProcessStandards({
  model,
  length,
  partNo,
  operation,
  select,
}: ProcessStandardMatchParams & {
  select: '*' | 'standard_seconds'
}): Promise<ProcessStandardMatchResult<ProcessStandard | ProcessStandardStandardSeconds>> {
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
        records: (data || []) as Array<ProcessStandard | ProcessStandardStandardSeconds>,
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
      records: (data || []) as Array<ProcessStandard | ProcessStandardStandardSeconds>,
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
  const result = await fetchMatchedProcessStandards({
    model,
    operation,
    length,
    partNo,
    select: 'standard_seconds',
  })

  return (result.records[0] as ProcessStandardStandardSeconds | undefined)?.standard_seconds ?? 0
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

export async function getSalesOrdersProjectNos() {
  const salesOrdersQuery = supabase
    .from('sales_orders')
    .select(
      'project_no, product_model, length_mm, material_code, customer, customer_model, created_at',
    )

  const { data, error } = await (salesOrdersQuery as typeof salesOrdersQuery & {
    eq(column: string, value: string): typeof salesOrdersQuery
  })
    .eq('status', '生产中')
    .not('project_no', 'is', null)
    .order('created_at', { ascending: false })
    .order('project_no', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取项目号列表失败')
  }

  return ((data || []).filter(
    (item): item is SalesOrderProjectNoOption => item.project_no !== null,
  )) as SalesOrderProjectNoOption[]
}

export async function getSalesOrderByProjectNo(projectNo: string) {
  const { data, error } = await supabase
    .from('sales_orders')
    .select(
      'project_no, product_model, length_mm, material_code, customer, customer_model',
    )
    .eq('project_no', projectNo)
    .single()

  if (error) {
    throw handleApiError(error, '获取销售订单信息失败')
  }

  if (!data?.project_no) {
    throw new Error('销售订单项目号不存在')
  }

  return data as SalesOrderProjectNoDetail
}
