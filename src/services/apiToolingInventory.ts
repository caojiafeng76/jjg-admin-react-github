import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface ToolingInventory {
  id: string
  tooling_data_id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
  pending_stock_in: number
  pending_stock_out: number
  current_stock: number
  final_stock: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface ToolingInventoryFormValues {
  tooling_data_id: string
  pending_stock_in: number
  pending_stock_out: number
  current_stock: number
  remarks: string
}

export interface ToolingInventoryImportRow {
  tool_code: string
  current_stock: number
  remarks: string
}

export interface ToolingDataOption {
  id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function inventoryTable() {
  return (supabase as unknown as DynamicSupabaseTable).from('tooling_inventory')
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
  values: ToolingInventoryFormValues,
): ToolingInventoryFormValues {
  return {
    tooling_data_id: values.tooling_data_id,
    pending_stock_in: normalizeQuantity(values.pending_stock_in),
    pending_stock_out: normalizeQuantity(values.pending_stock_out),
    current_stock: normalizeQuantity(values.current_stock),
    remarks: normalizeText(values.remarks),
  }
}

function normalizeImportRow(
  row: ToolingInventoryImportRow,
): ToolingInventoryImportRow {
  return {
    tool_code: normalizeText(row.tool_code),
    current_stock: normalizeQuantity(row.current_stock),
    remarks: normalizeText(row.remarks),
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

async function ensureInventoryToolingUnique(
  toolingDataId: string,
  excludeId?: string,
) {
  let query = inventoryTable()
    .select('id')
    .eq('tooling_data_id', toolingDataId)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查刀具库存是否重复失败')
  }

  if ((data || []).length > 0) {
    throw new Error('该刀具资料已存在库存记录，请勿重复创建')
  }
}

function buildInventoryPayload(
  snapshot: ToolingDataOption,
  values: Pick<
    ToolingInventoryFormValues,
    'pending_stock_in' | 'pending_stock_out' | 'current_stock' | 'remarks'
  >,
) {
  return {
    tooling_data_id: snapshot.id,
    tool_code: snapshot.tool_code,
    tool_name: snapshot.tool_name,
    tool_spec: snapshot.tool_spec,
    material: snapshot.material,
    unit_price: normalizeQuantity(snapshot.unit_price),
    pending_stock_in: normalizeQuantity(values.pending_stock_in),
    pending_stock_out: normalizeQuantity(values.pending_stock_out),
    current_stock: normalizeQuantity(values.current_stock),
    remarks: normalizeText(values.remarks),
  }
}

export async function getToolingDataOptions(keyword?: string) {
  let query = toolingDataTable()
    .select('id, tool_code, tool_name, tool_spec, material, unit_price')
    .order('tool_code', { ascending: true })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `tool_code.ilike.%${normalizedKeyword}%,tool_name.ilike.%${normalizedKeyword}%,tool_spec.ilike.%${normalizedKeyword}%,material.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取刀具资料选项失败')
  }

  return (data || []) as ToolingDataOption[]
}

export async function getToolingInventoryList({
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

  let query = inventoryTable().select('*', { count: 'exact' })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `tool_code.ilike.%${normalizedKeyword}%,tool_name.ilike.%${normalizedKeyword}%,tool_spec.ilike.%${normalizedKeyword}%,material.ilike.%${normalizedKeyword}%,remarks.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('final_stock', { ascending: true })
    .order('tool_code', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取刀具库存列表失败')
  }

  return {
    items: (data || []) as ToolingInventory[],
    total: count || 0,
  }
}

export async function createToolingInventory(
  values: ToolingInventoryFormValues,
) {
  const payload = normalizeFormValues(values)
  const snapshot = await getToolingSnapshot(payload.tooling_data_id)

  await ensureInventoryToolingUnique(snapshot.id)

  const { error } = await inventoryTable().insert(
    buildInventoryPayload(snapshot, payload),
  )

  if (error) {
    throw handleApiError(error, '创建刀具库存失败')
  }
}

export async function updateToolingInventory({
  id,
  values,
}: {
  id: string
  values: ToolingInventoryFormValues
}) {
  const payload = normalizeFormValues(values)
  const snapshot = await getToolingSnapshot(payload.tooling_data_id)

  await ensureInventoryToolingUnique(snapshot.id, id)

  const { error } = await inventoryTable()
    .update(buildInventoryPayload(snapshot, payload))
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新刀具库存失败')
  }
}

export async function importToolingInventory(
  rows: ToolingInventoryImportRow[],
) {
  const normalizedRows = rows.map(normalizeImportRow)
  const toolCodeSet = new Set<string>()

  for (const row of normalizedRows) {
    if (toolCodeSet.has(row.tool_code)) {
      throw new Error(`Excel 中存在重复刀具编号“${row.tool_code}”`)
    }
    toolCodeSet.add(row.tool_code)
  }

  const toolCodes = normalizedRows.map((row) => row.tool_code)
  const { data: toolingRows, error: toolingError } = await toolingDataTable()
    .select('id, tool_code, tool_name, tool_spec, material, unit_price')
    .in('tool_code', toolCodes)

  if (toolingError) {
    throw handleApiError(toolingError, '校验刀具资料失败')
  }

  const toolingMap = new Map(
    ((toolingRows || []) as ToolingDataOption[]).map((row) => [
      row.tool_code,
      row,
    ]),
  )

  const missingCodes = toolCodes.filter((code) => !toolingMap.has(code))
  if (missingCodes.length > 0) {
    throw new Error(
      `以下刀具编号未在刀具资料中维护，无法导入库存：${missingCodes.join('、')}`,
    )
  }

  const toolingIds = Array.from(
    new Set((toolingRows || []).map((row: { id: string }) => row.id)),
  )
  const { data: existingRows, error: existingError } = await inventoryTable()
    .select('id, tooling_data_id, pending_stock_in, pending_stock_out')
    .in('tooling_data_id', toolingIds)

  if (existingError) {
    throw handleApiError(existingError, '查询现有刀具库存失败')
  }

  const existingMap = new Map(
    (
      (existingRows || []) as Array<{
        id: string
        tooling_data_id: string
        pending_stock_in: number
        pending_stock_out: number
      }>
    ).map((row) => [row.tooling_data_id, row]),
  )

  const payload = normalizedRows.map((row) => {
    const tooling = toolingMap.get(row.tool_code)
    if (!tooling) {
      throw new Error(`刀具编号“${row.tool_code}”未维护刀具资料`)
    }

    const existing = existingMap.get(tooling.id)

    return {
      ...(existing?.id ? { id: existing.id } : {}),
      tooling_data_id: tooling.id,
      tool_code: tooling.tool_code,
      tool_name: tooling.tool_name,
      tool_spec: tooling.tool_spec,
      material: tooling.material,
      unit_price: normalizeQuantity(tooling.unit_price),
      pending_stock_in: normalizeQuantity(existing?.pending_stock_in),
      pending_stock_out: normalizeQuantity(existing?.pending_stock_out),
      current_stock: normalizeQuantity(row.current_stock),
      remarks: row.remarks,
    }
  })

  const { error } = await inventoryTable().upsert(payload, {
    onConflict: 'tooling_data_id',
  })

  if (error) {
    throw handleApiError(error, '批量导入刀具库存失败')
  }
}

export async function deleteToolingInventory(ids: string[]) {
  const { error } = await inventoryTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除刀具库存失败')
  }
}
