import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface ToolingData {
  id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
  usage: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface ToolingDataFormValues {
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
  usage: string
  remarks: string
}

type ToolingDataTable = {
  from: (table: string) => any
}

function toolingDataTable() {
  return (supabase as unknown as ToolingDataTable).from('tooling_data')
}

function normalizePayload(values: ToolingDataFormValues): ToolingDataFormValues {
  return {
    tool_code: values.tool_code.trim(),
    tool_name: values.tool_name.trim(),
    tool_spec: values.tool_spec.trim(),
    material: values.material.trim(),
    unit_price: Number(values.unit_price ?? 0),
    usage: values.usage.trim(),
    remarks: values.remarks.trim(),
  }
}

async function checkToolingDataExists(toolCode: string, excludeId?: string) {
  let query = toolingDataTable().select('id').eq('tool_code', toolCode).limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查刀具编号是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getToolingDataList({
  page,
  pageSize,
  keyword,
}: {
  page: number
  pageSize: number
  keyword?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = toolingDataTable().select('*', { count: 'exact' })

  if (keyword) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `tool_code.ilike.%${normalizedKeyword}%,tool_name.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('tool_code', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取刀具资料列表失败')
  }

  return {
    items: (data || []) as ToolingData[],
    total: count || 0,
  }
}

export async function createToolingData(values: ToolingDataFormValues) {
  const payload = normalizePayload(values)

  const exists = await checkToolingDataExists(payload.tool_code)
  if (exists) {
    throw new Error(`刀具编号“${payload.tool_code}”已存在，无法创建`)
  }

  const { error } = await toolingDataTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建刀具资料失败')
  }
}

export async function createToolingDataBatch(rows: ToolingDataFormValues[]) {
  const payload = rows.map(normalizePayload)

  const toolCodeSet = new Set<string>()
  for (const row of payload) {
    if (toolCodeSet.has(row.tool_code)) {
      throw new Error(`Excel 中存在重复刀具编号“${row.tool_code}”`)
    }
    toolCodeSet.add(row.tool_code)
  }

  const toolCodes = payload.map((row) => row.tool_code)
  const { data: existingRows, error: existingError } = await toolingDataTable()
    .select('tool_code')
    .in('tool_code', toolCodes)

  if (existingError) {
    throw handleApiError(existingError, '检查刀具编号是否存在失败')
  }

  if ((existingRows || []).length > 0) {
    const duplicateCodes = (existingRows || [])
      .map((row: { tool_code: string }) => row.tool_code)
      .join('、')
    throw new Error(`以下刀具编号已存在，无法导入：${duplicateCodes}`)
  }

  const { error } = await toolingDataTable().insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入刀具资料失败')
  }
}

export async function updateToolingData({
  id,
  values,
}: {
  id: string
  values: ToolingDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkToolingDataExists(payload.tool_code, id)
  if (exists) {
    throw new Error(`刀具编号“${payload.tool_code}”已存在，无法更新`)
  }

  const { error } = await toolingDataTable().update(payload).eq('id', id)

  if (error) {
    throw handleApiError(error, '更新刀具资料失败')
  }
}

export async function deleteToolingData(ids: string[]) {
  const { error } = await toolingDataTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除刀具资料失败')
  }
}