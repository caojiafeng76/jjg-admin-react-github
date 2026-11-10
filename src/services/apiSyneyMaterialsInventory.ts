import type { SyneyMaterialsSearchFilters } from './syneyMaterialsSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import { describeSyneyMaterial, syneyMaterialsKeyOf } from './apiSyneyMaterialsData'
import { applyJintanSearchFilters } from './jintanSearchFields'
import supabase from './supabase'
import {
  applySyneyMaterialsKeyword,
  SYNEY_MATERIALS_SEARCH_FIELDS,
} from './syneyMaterialsSearchFields'

export interface SyneyMaterialsInventory {
  id: string
  material_data_id: string
  material_name: string
  specification: string
  unit: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface SyneyMaterialsInventoryFormValues {
  quantity: number
  remarks: string
}

export interface SyneyMaterialsInventoryImportRow {
  material_name: string
  specification: string
  quantity: number
  remarks: string
}

export interface SyneyMaterialsInventoryOption {
  id: string
  material_name: string
  specification: string
  unit: string
  quantity: number
}

const EXPORT_PAGE_SIZE = 1000

export async function getSyneyMaterialsInventoryList({
  page,
  pageSize,
  filters,
  keyword,
}: {
  page: number
  pageSize: number
  filters?: SyneyMaterialsSearchFilters
  /** 手机端单关键词：品名或规格 */
  keyword?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('syney_materials_inventory')
    .select('*', { count: 'exact' })

  query = applyJintanSearchFilters(query, filters, SYNEY_MATERIALS_SEARCH_FIELDS)
  query = applySyneyMaterialsKeyword(query, keyword)

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('material_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取材料库存列表失败')
  }

  return {
    items: (data || []) as SyneyMaterialsInventory[],
    total: count || 0,
  }
}

export async function getSyneyMaterialsInventoryByDataId(
  materialDataId: string,
  signal?: AbortSignal,
): Promise<SyneyMaterialsInventory | null> {
  let query = supabase
    .from('syney_materials_inventory')
    .select('*')
    .eq('material_data_id', materialDataId)
    .limit(1)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw handleApiError(error, '获取材料库存详情失败')
  }

  return (data as SyneyMaterialsInventory | null) ?? null
}

export async function getSyneyMaterialsInventoryForExport(
  filters?: SyneyMaterialsSearchFilters,
) {
  const rows: SyneyMaterialsInventory[] = []
  let from = 0

  while (true) {
    let query = supabase.from('syney_materials_inventory').select('*')
    query = applyJintanSearchFilters(query, filters, SYNEY_MATERIALS_SEARCH_FIELDS)

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('material_name', { ascending: true })
      .range(from, from + EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取材料库存导出数据失败')
    }

    const pageRows = (data || []) as SyneyMaterialsInventory[]
    rows.push(...pageRows)

    if (pageRows.length < EXPORT_PAGE_SIZE) {
      break
    }

    from += EXPORT_PAGE_SIZE
  }

  return rows
}

export async function updateSyneyMaterialsInventory({
  id,
  values,
}: {
  id: string
  values: SyneyMaterialsInventoryFormValues
}) {
  if (!Number.isSafeInteger(values.quantity) || values.quantity < 0) {
    throw new Error('库存数量必须为非负整数')
  }

  const { error } = await supabase
    .from('syney_materials_inventory')
    .update({ quantity: values.quantity, remarks: (values.remarks ?? '').trim() })
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新材料库存失败')
  }
}

/** 按 品名 + 规格 匹配已有库存行，覆盖数量与备注；资料不存在时整体拒绝 */
export async function updateSyneyMaterialsInventoryBatch(
  rows: SyneyMaterialsInventoryImportRow[],
) {
  if (rows.length === 0) {
    return
  }

  const seenKeys = new Set<string>()
  for (const row of rows) {
    const key = syneyMaterialsKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(`${describeSyneyMaterial(row)}在 Excel 中重复，无法导入`)
    }
    seenKeys.add(key)
  }

  const materialNames = Array.from(new Set(rows.map(row => row.material_name)))
  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('syney_materials_inventory')
    .select('id, material_data_id, material_name, specification, unit')
    .in('material_name', materialNames)

  if (inventoryError) {
    throw handleApiError(inventoryError, '检查材料库存失败')
  }

  const inventoryByKey = new Map(
    (inventoryRows || []).map(row => [syneyMaterialsKeyOf(row), row]),
  )

  const missing = rows.filter(row => !inventoryByKey.has(syneyMaterialsKeyOf(row)))
  if (missing.length > 0) {
    const labels = missing
      .map(row => `“${row.material_name}”/“${row.specification}”`)
      .join('、')
    throw new Error(`以下材料在材料资料中不存在，请先维护材料资料：${labels}`)
  }

  const payload = rows.map((row) => {
    const matched = inventoryByKey.get(syneyMaterialsKeyOf(row))!
    return {
      id: matched.id,
      material_data_id: matched.material_data_id,
      material_name: matched.material_name,
      specification: matched.specification,
      unit: matched.unit,
      quantity: row.quantity,
      remarks: row.remarks.trim(),
    }
  })

  const { error } = await supabase
    .from('syney_materials_inventory')
    .upsert(payload)

  if (error) {
    throw handleApiError(error, '批量导入材料库存失败')
  }
}

export async function getSyneyMaterialsInventoryOptions(
  keyword?: string,
): Promise<SyneyMaterialsInventoryOption[]> {
  let query = supabase
    .from('syney_materials_inventory')
    .select('id, material_name, specification, unit, quantity')

  query = applySyneyMaterialsKeyword(query, keyword)

  const { data, error } = await query
    .order('material_name', { ascending: true })
    .order('specification', { ascending: true })
    .limit(50)

  if (error)
    throw handleApiError(error, '获取材料库存选项失败')
  return (data ?? []) as SyneyMaterialsInventoryOption[]
}
