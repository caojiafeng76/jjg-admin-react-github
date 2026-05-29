import dayjs from 'dayjs'

import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

const TOOLING_DATA_EXPORT_PAGE_SIZE = 1000

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

export interface ToolingDataMonthlySummary extends ToolingData {
  opening_quantity: number
  stock_in_quantity: number
  stock_out_quantity: number
  closing_quantity: number
}

type ToolingDataTable = {
  from: (table: string) => any
}

interface ToolingInventorySnapshot {
  tooling_data_id: string
  current_stock: number
}

interface ToolingStockInQuantityRow {
  tooling_data_id: string
  stock_in_quantity: number
}

interface ToolingStockOutQuantityRow {
  tooling_data_id: string
  stock_out_quantity: number
}

function toolingDataTable() {
  return (supabase as unknown as ToolingDataTable).from('tooling_data')
}

function toolingInventoryTable() {
  return (supabase as unknown as ToolingDataTable).from('tooling_inventory')
}

function toolingStockInTable() {
  return (supabase as unknown as ToolingDataTable).from('tooling_stock_in')
}

function toolingStockOutTable() {
  return (supabase as unknown as ToolingDataTable).from('tooling_stock_out')
}

async function fetchPagedRows<T>(
  queryFactory: () => any,
  errorMessage: string,
) {
  const rows: T[] = []
  let from = 0

  while (true) {
    const { data, error } = await queryFactory().range(
      from,
      from + TOOLING_DATA_EXPORT_PAGE_SIZE - 1,
    )

    if (error) {
      throw handleApiError(error, errorMessage)
    }

    const pageRows = (data || []) as T[]
    rows.push(...pageRows)

    if (pageRows.length < TOOLING_DATA_EXPORT_PAGE_SIZE) {
      break
    }

    from += TOOLING_DATA_EXPORT_PAGE_SIZE
  }

  return rows
}

function normalizePayload(
  values: ToolingDataFormValues,
): ToolingDataFormValues {
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

export async function getToolingDataForExport() {
  return fetchPagedRows<ToolingData>(
    () =>
      toolingDataTable()
        .select('*')
        .order('updated_at', { ascending: false })
        .order('tool_code', { ascending: true }),
    '获取刀具资料导出数据失败',
  )
}

function normalizeQuantity(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundQuantity(value: number) {
  return Number(value.toFixed(3))
}

function sumRowsByToolingDataId<T extends { tooling_data_id: string }>(
  rows: T[],
  quantityKey: keyof T,
) {
  const quantityMap = new Map<string, number>()

  rows.forEach((row) => {
    const quantity = normalizeQuantity(row[quantityKey] as number | string)
    quantityMap.set(
      row.tooling_data_id,
      (quantityMap.get(row.tooling_data_id) || 0) + quantity,
    )
  })

  return quantityMap
}

export async function getToolingDataMonthlySummary({
  month,
}: {
  month: string
}) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('导出月份格式无效')
  }

  const monthStart = dayjs(`${month}-01`).startOf('month')

  if (!monthStart.isValid() || monthStart.format('YYYY-MM') !== month) {
    throw new Error('导出月份格式无效')
  }

  const nextMonthStart = monthStart.add(1, 'month')
  const monthStartDate = monthStart.format('YYYY-MM-DD')
  const nextMonthStartDate = nextMonthStart.format('YYYY-MM-DD')
  const monthStartTimestamp = monthStart.toISOString()
  const nextMonthStartTimestamp = nextMonthStart.toISOString()

  const [
    toolingRows,
    inventoryRows,
    monthlyStockInRows,
    monthlyStockOutRows,
    laterStockInRows,
    laterStockOutRows,
  ] = await Promise.all([
    getToolingDataForExport(),
    fetchPagedRows<ToolingInventorySnapshot>(
      () =>
        toolingInventoryTable()
          .select('tooling_data_id, current_stock')
          .order('tooling_data_id', { ascending: true }),
      '获取刀具库存数据失败',
    ),
    fetchPagedRows<ToolingStockInQuantityRow>(
      () =>
        toolingStockInTable()
          .select('id, tooling_data_id, stock_in_quantity')
          .eq('status', '已审核')
          .gte('created_at', monthStartTimestamp)
          .lt('created_at', nextMonthStartTimestamp)
          .order('tooling_data_id', { ascending: true })
          .order('created_at', { ascending: true })
          .order('id', { ascending: true }),
      '获取刀具月度入库数据失败',
    ),
    fetchPagedRows<ToolingStockOutQuantityRow>(
      () =>
        toolingStockOutTable()
          .select('id, tooling_data_id, stock_out_quantity')
          .eq('status', '已审核')
          .gte('stock_out_date', monthStartDate)
          .lt('stock_out_date', nextMonthStartDate)
          .order('tooling_data_id', { ascending: true })
          .order('stock_out_date', { ascending: true })
          .order('id', { ascending: true }),
      '获取刀具月度出库数据失败',
    ),
    fetchPagedRows<ToolingStockInQuantityRow>(
      () =>
        toolingStockInTable()
          .select('id, tooling_data_id, stock_in_quantity')
          .eq('status', '已审核')
          .gte('created_at', nextMonthStartTimestamp)
          .order('tooling_data_id', { ascending: true })
          .order('created_at', { ascending: true })
          .order('id', { ascending: true }),
      '获取刀具后续入库数据失败',
    ),
    fetchPagedRows<ToolingStockOutQuantityRow>(
      () =>
        toolingStockOutTable()
          .select('id, tooling_data_id, stock_out_quantity')
          .eq('status', '已审核')
          .gte('stock_out_date', nextMonthStartDate)
          .order('tooling_data_id', { ascending: true })
          .order('stock_out_date', { ascending: true })
          .order('id', { ascending: true }),
      '获取刀具后续出库数据失败',
    ),
  ])

  const currentStockMap = new Map(
    inventoryRows.map((row) => [
      row.tooling_data_id,
      normalizeQuantity(row.current_stock),
    ]),
  )
  const monthlyStockInMap = sumRowsByToolingDataId(
    monthlyStockInRows,
    'stock_in_quantity',
  )
  const monthlyStockOutMap = sumRowsByToolingDataId(
    monthlyStockOutRows,
    'stock_out_quantity',
  )
  const laterStockInMap = sumRowsByToolingDataId(
    laterStockInRows,
    'stock_in_quantity',
  )
  const laterStockOutMap = sumRowsByToolingDataId(
    laterStockOutRows,
    'stock_out_quantity',
  )

  return toolingRows.map((item) => {
    const currentStock = currentStockMap.get(item.id) || 0
    const stockInQuantity = monthlyStockInMap.get(item.id) || 0
    const stockOutQuantity = monthlyStockOutMap.get(item.id) || 0
    const laterStockInQuantity = laterStockInMap.get(item.id) || 0
    const laterStockOutQuantity = laterStockOutMap.get(item.id) || 0
    const closingQuantity =
      currentStock - laterStockInQuantity + laterStockOutQuantity
    const openingQuantity = closingQuantity - stockInQuantity + stockOutQuantity

    return {
      ...item,
      opening_quantity: roundQuantity(openingQuantity),
      stock_in_quantity: roundQuantity(stockInQuantity),
      stock_out_quantity: roundQuantity(stockOutQuantity),
      closing_quantity: roundQuantity(closingQuantity),
    }
  }) satisfies ToolingDataMonthlySummary[]
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
