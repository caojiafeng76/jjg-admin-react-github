import supabase from './supabase'
import {
  buildToolingDataOptionsQuery,
  TOOLING_DATA_OPTION_SELECT,
} from './toolingDataOptions'
import { handleApiError } from '@/utils/errorHandler'

export type ToolingStockInStatus = '待审核' | '已审核'

export interface ToolingDataOption {
  id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
}

export interface ToolingStockIn {
  id: string
  tooling_data_id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
  status: ToolingStockInStatus
  stock_in_quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface ToolingStockInFormValues {
  tooling_data_id: string
  status: ToolingStockInStatus
  stock_in_quantity: number
  remarks: string
}

export interface ToolingStockInBatchStatusValues {
  ids: string[]
  status: ToolingStockInStatus
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function stockInTable() {
  return (supabase as unknown as DynamicSupabaseTable).from('tooling_stock_in')
}

function toolingDataTable() {
  return (supabase as unknown as DynamicSupabaseTable).from('tooling_data')
}

function normalizeQuantity(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim()
}

function normalizeFormValues(
  values: ToolingStockInFormValues,
): ToolingStockInFormValues {
  return {
    tooling_data_id: values.tooling_data_id,
    status: values.status || '待审核',
    stock_in_quantity: normalizeQuantity(values.stock_in_quantity),
    remarks: normalizeText(values.remarks),
  }
}

async function getToolingSnapshot(toolingDataId: string) {
  const { data, error } = await toolingDataTable()
    .select('id, tool_code, tool_name, tool_spec, material, unit_price')
    .eq('id', toolingDataId)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取刀具资料失败')
  }

  if (!data) {
    throw new Error('所选刀具资料不存在，请先维护刀具资料')
  }

  return data as ToolingDataOption
}

function buildStockInPayload(
  snapshot: ToolingDataOption,
  values: ToolingStockInFormValues,
) {
  return {
    tooling_data_id: snapshot.id,
    tool_code: snapshot.tool_code,
    tool_name: snapshot.tool_name,
    tool_spec: snapshot.tool_spec,
    material: snapshot.material,
    unit_price: normalizeQuantity(snapshot.unit_price),
    status: values.status,
    stock_in_quantity: normalizeQuantity(values.stock_in_quantity),
    remarks: normalizeText(values.remarks),
  }
}

export async function getToolingDataOptions(
  keyword?: string,
  signal?: AbortSignal,
  limit?: number,
) {
  const query = buildToolingDataOptionsQuery(
    toolingDataTable().select(TOOLING_DATA_OPTION_SELECT),
    { keyword, signal, limit },
  )

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取刀具资料选项失败')
  }

  return (data || []) as ToolingDataOption[]
}

export async function getToolingStockInList({
  page,
  pageSize,
  keyword,
  status,
  signal,
}: {
  page: number
  pageSize: number
  keyword?: string
  status?: ToolingStockInStatus
  signal?: AbortSignal
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = stockInTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `tool_code.ilike.%${normalizedKeyword}%,tool_name.ilike.%${normalizedKeyword}%,tool_spec.ilike.%${normalizedKeyword}%,material.ilike.%${normalizedKeyword}%,remarks.ilike.%${normalizedKeyword}%`,
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  query = query
    .order('updated_at', { ascending: false })
    .order('tool_code', { ascending: true })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取刀具入库列表失败')
  }

  return {
    items: (data || []) as ToolingStockIn[],
    total: count || 0,
  }
}

export async function createToolingStockIn(values: ToolingStockInFormValues) {
  const payload = normalizeFormValues(values)
  const snapshot = await getToolingSnapshot(payload.tooling_data_id)

  const { error } = await stockInTable().insert(
    buildStockInPayload(snapshot, payload),
  )

  if (error) {
    throw handleApiError(error, '创建刀具入库失败')
  }
}

export async function updateToolingStockIn({
  id,
  values,
}: {
  id: string
  values: ToolingStockInFormValues
}) {
  const payload = normalizeFormValues(values)
  const snapshot = await getToolingSnapshot(payload.tooling_data_id)

  const { error } = await stockInTable()
    .update(buildStockInPayload(snapshot, payload))
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新刀具入库失败')
  }
}

export async function batchUpdateToolingStockInStatus({
  ids,
  status,
}: ToolingStockInBatchStatusValues) {
  const normalizedIds = ids.filter(Boolean)

  if (normalizedIds.length === 0) {
    throw new Error('请选择至少一条刀具入库数据')
  }

  const { error } = await stockInTable()
    .update({ status })
    .in('id', normalizedIds)

  if (error) {
    throw handleApiError(
      error,
      `批量${status === '已审核' ? '审核' : '反审'}刀具入库失败`,
    )
  }
}

export async function deleteToolingStockIn(ids: string[]) {
  const { error } = await stockInTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除刀具入库失败')
  }
}
