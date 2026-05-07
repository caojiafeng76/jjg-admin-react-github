import dayjs from 'dayjs'

import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export type ToolingStockOutStatus = '待审核' | '已审核'

export interface ToolingDataOption {
  id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
}

export interface ToolingStockOut {
  id: string
  tooling_data_id: string
  machine_equipment_id: string | null
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
  recipient: string
  purpose: string
  stock_out_date: string
  status: ToolingStockOutStatus
  stock_out_quantity: number
  collection_method: string
  final_stock?: number | null
  machine_no?: string
  machine_name?: string
  remarks: string
  created_at: string
  updated_at: string
}

interface ToolingInventorySnapshot {
  tooling_data_id: string
  final_stock: number
}

type ToolingStockOutRow = ToolingStockOut & {
  machine_equipment_maintenances?:
    | {
        id: string
        unified_device_no: string
        machine_name: string
      }
    | Array<{
        id: string
        unified_device_no: string
        machine_name: string
      }>
    | null
}

export interface ToolingStockOutFormValues {
  tooling_data_id: string
  machine_equipment_id: string | null
  recipient: string
  purpose: string
  stock_out_date: string
  status: ToolingStockOutStatus
  stock_out_quantity: number
  collection_method: string
  remarks: string
}

export interface ToolingStockOutBatchStatusValues {
  ids: string[]
  status: ToolingStockOutStatus
}

export interface ToolingStockOutImportRow {
  tool_code: string
  tool_name: string
  recipient: string
  purpose: string
  stock_out_date: string
  stock_out_quantity: number
  collection_method: string
  remarks: string
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

function stockOutTable() {
  return (supabase as unknown as DynamicSupabaseTable).from('tooling_stock_out')
}

function toolingDataTable() {
  return (supabase as unknown as DynamicSupabaseTable).from('tooling_data')
}

const TOOLING_STOCK_OUT_SELECT = `
  *,
  machine_equipment_maintenances(id, unified_device_no, machine_name)
`

function normalizeQuantity(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim()
}

function normalizeDateString(value: string | null | undefined) {
  const normalized = normalizeText(value)

  if (!normalized) {
    throw new Error('出库日期不能为空')
  }

  const parsed = dayjs(normalized)

  if (!parsed.isValid()) {
    throw new Error('出库日期格式无效，请使用 YYYY-MM-DD')
  }

  return parsed.format('YYYY-MM-DD')
}

function normalizeFormValues(
  values: ToolingStockOutFormValues,
): ToolingStockOutFormValues {
  if (!values.tooling_data_id) {
    throw new Error('请选择刀具资料')
  }

  return {
    tooling_data_id: values.tooling_data_id,
    machine_equipment_id: values.machine_equipment_id || null,
    recipient: normalizeText(values.recipient),
    purpose: normalizeText(values.purpose),
    stock_out_date: normalizeDateString(values.stock_out_date),
    status: values.status || '待审核',
    stock_out_quantity: normalizeQuantity(values.stock_out_quantity),
    collection_method: values.collection_method || '新领取',
    remarks: normalizeText(values.remarks),
  }
}

function normalizeImportRow(
  row: ToolingStockOutImportRow,
): ToolingStockOutImportRow {
  return {
    tool_code: normalizeText(row.tool_code),
    tool_name: normalizeText(row.tool_name),
    recipient: normalizeText(row.recipient),
    purpose: normalizeText(row.purpose),
    stock_out_date: normalizeDateString(row.stock_out_date),
    stock_out_quantity: normalizeQuantity(row.stock_out_quantity),
    collection_method: row.collection_method || '新领取',
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

function buildStockOutPayload(
  snapshot: ToolingDataOption,
  values: ToolingStockOutFormValues,
) {
  return {
    tooling_data_id: snapshot.id,
    machine_equipment_id: values.machine_equipment_id,
    tool_code: snapshot.tool_code,
    tool_name: snapshot.tool_name,
    tool_spec: snapshot.tool_spec,
    material: snapshot.material,
    unit_price: normalizeQuantity(snapshot.unit_price),
    recipient: values.recipient,
    purpose: values.purpose,
    stock_out_date: values.stock_out_date,
    status: values.status,
    stock_out_quantity: normalizeQuantity(values.stock_out_quantity),
    collection_method: values.collection_method || '新领取',
    remarks: values.remarks,
  }
}

function extractMachineInfo(
  machineEquipment: ToolingStockOutRow['machine_equipment_maintenances'],
) {
  const value = Array.isArray(machineEquipment)
    ? machineEquipment[0]
    : machineEquipment

  return {
    machine_no: value?.unified_device_no || '',
    machine_name: value?.machine_name || '',
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

export async function getToolingStockOutList({
  page,
  pageSize,
  keyword,
  status,
}: {
  page: number
  pageSize: number
  keyword?: string
  status?: ToolingStockOutStatus
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = stockOutTable().select(TOOLING_STOCK_OUT_SELECT, {
    count: 'exact',
  })

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `recipient.ilike.%${normalizedKeyword}%,purpose.ilike.%${normalizedKeyword}%,tool_code.ilike.%${normalizedKeyword}%,tool_name.ilike.%${normalizedKeyword}%,tool_spec.ilike.%${normalizedKeyword}%,material.ilike.%${normalizedKeyword}%,remarks.ilike.%${normalizedKeyword}%`,
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query
    .order('status', { ascending: false })
    .order('stock_out_date', { ascending: false })
    .order('updated_at', { ascending: false })
    .order('tool_code', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取刀具出库列表失败')
  }

  const items = (data || []) as ToolingStockOutRow[]
  const toolingIds = Array.from(
    new Set(items.map((item) => item.tooling_data_id)),
  )
  const inventoryMap = new Map<string, number>()

  if (toolingIds.length > 0) {
    const { data: inventoryRows, error: inventoryError } = await (
      supabase as unknown as DynamicSupabaseTable
    )
      .from('tooling_inventory')
      .select('tooling_data_id, final_stock')
      .in('tooling_data_id', toolingIds)

    if (inventoryError) {
      throw handleApiError(inventoryError, '获取刀具库存快照失败')
    }

    ;((inventoryRows || []) as ToolingInventorySnapshot[]).forEach((row) => {
      inventoryMap.set(row.tooling_data_id, normalizeQuantity(row.final_stock))
    })
  }

  return {
    items: items.map((item) => ({
      ...item,
      ...extractMachineInfo(item.machine_equipment_maintenances),
      final_stock: inventoryMap.get(item.tooling_data_id) ?? null,
    })),
    total: count || 0,
  }
}

export async function createToolingStockOut(values: ToolingStockOutFormValues) {
  const payload = normalizeFormValues(values)
  const snapshot = await getToolingSnapshot(payload.tooling_data_id)

  const { error } = await stockOutTable().insert(
    buildStockOutPayload(snapshot, payload),
  )

  if (error) {
    throw handleApiError(error, '创建刀具出库失败')
  }
}

export async function updateToolingStockOut({
  id,
  values,
}: {
  id: string
  values: ToolingStockOutFormValues
}) {
  const payload = normalizeFormValues(values)
  const snapshot = await getToolingSnapshot(payload.tooling_data_id)

  const { error } = await stockOutTable()
    .update(buildStockOutPayload(snapshot, payload))
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新刀具出库失败')
  }
}

export async function batchUpdateToolingStockOutStatus({
  ids,
  status,
}: ToolingStockOutBatchStatusValues) {
  const normalizedIds = ids.filter(Boolean)

  if (normalizedIds.length === 0) {
    throw new Error('请选择至少一条刀具出库数据')
  }

  const { error } = await stockOutTable()
    .update({ status })
    .in('id', normalizedIds)

  if (error) {
    throw handleApiError(
      error,
      `批量${status === '已审核' ? '审核' : '反审'}刀具出库失败`,
    )
  }
}

export async function importToolingStockOut(rows: ToolingStockOutImportRow[]) {
  const normalizedRows = rows.map(normalizeImportRow)
  const toolCodes = Array.from(
    new Set(normalizedRows.map((row) => row.tool_code)),
  )

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
      `以下刀具编号未在刀具资料中维护，无法导入出库：${missingCodes.join('、')}`,
    )
  }

  const payload = normalizedRows.map((row) => {
    const tooling = toolingMap.get(row.tool_code)
    if (!tooling) {
      throw new Error(`刀具编号“${row.tool_code}”未维护刀具资料`)
    }

    return {
      tooling_data_id: tooling.id,
      tool_code: tooling.tool_code,
      tool_name: tooling.tool_name,
      tool_spec: tooling.tool_spec,
      material: tooling.material,
      unit_price: normalizeQuantity(tooling.unit_price),
      recipient: row.recipient,
      purpose: row.purpose,
      stock_out_date: row.stock_out_date,
      status: '待审核' satisfies ToolingStockOutStatus,
      stock_out_quantity: normalizeQuantity(row.stock_out_quantity),
      collection_method: row.collection_method || '新领取',
      remarks: row.remarks,
    }
  })

  const { error } = await stockOutTable().insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入刀具出库失败')
  }
}

export async function deleteToolingStockOut(ids: string[]) {
  const { error } = await stockOutTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除刀具出库失败')
  }
}
