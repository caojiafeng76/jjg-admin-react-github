import type { WorkshopMiscMaterialsSearchFilters } from './workshopMiscMaterialsSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import {
  describeWorkshopMiscMaterial,
  workshopMiscMaterialsKeyOf,
} from './apiWorkshopMiscMaterialsData'
import supabase from './supabase'
import {
  applyWorkshopMiscMaterialsKeyword,
  applyWorkshopMiscMaterialsSearchFilters,
} from './workshopMiscMaterialsSearchFields'

export interface WorkshopMiscMaterialsInventory {
  id: string
  material_data_id: string
  model: string
  customer_model: string
  specification: string
  category: string
  raw_material_quantity: number
  semi_finished_quantity: number
  finished_quantity: number
  total_quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface WorkshopMiscMaterialsInventoryFormValues {
  raw_material_quantity: number
  semi_finished_quantity: number
  finished_quantity: number
  remarks: string
}

export interface WorkshopMiscMaterialsInventoryImportRow {
  model: string
  customer_model: string
  specification: string
  category: string
  raw_material_quantity: number
  semi_finished_quantity: number
  finished_quantity: number
  remarks: string
}

export interface WorkshopMiscMaterialsInventoryOption {
  id: string
  model: string
  customer_model: string
  specification: string
  category: string
  raw_material_quantity: number
  semi_finished_quantity: number
  finished_quantity: number
  total_quantity: number
}

const EXPORT_PAGE_SIZE = 1000

function assertNonNegativeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label}必须为非负整数`)
  }
}

export async function getWorkshopMiscMaterialsInventoryList({
  page,
  pageSize,
  filters,
  keyword,
}: {
  page: number
  pageSize: number
  filters?: WorkshopMiscMaterialsSearchFilters
  keyword?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('workshop_misc_materials_inventory')
    .select('*', { count: 'exact' })

  query = applyWorkshopMiscMaterialsSearchFilters(query, filters)
  query = applyWorkshopMiscMaterialsKeyword(query, keyword)

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('model', { ascending: true })
    .order('customer_model', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取车间杂项材料库存列表失败')
  }

  return {
    items: (data || []) as WorkshopMiscMaterialsInventory[],
    total: count || 0,
  }
}

export async function getWorkshopMiscMaterialsInventoryByDataId(
  materialDataId: string,
  signal?: AbortSignal,
): Promise<WorkshopMiscMaterialsInventory | null> {
  let query = supabase
    .from('workshop_misc_materials_inventory')
    .select('*')
    .eq('material_data_id', materialDataId)
    .limit(1)

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw handleApiError(error, '获取车间杂项材料库存详情失败')
  }

  return (data as WorkshopMiscMaterialsInventory | null) ?? null
}

export async function getWorkshopMiscMaterialsInventoryForExport(
  filters?: WorkshopMiscMaterialsSearchFilters,
) {
  const rows: WorkshopMiscMaterialsInventory[] = []
  let from = 0

  while (true) {
    let query = supabase.from('workshop_misc_materials_inventory').select('*')
    query = applyWorkshopMiscMaterialsSearchFilters(query, filters)

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('model', { ascending: true })
      .order('customer_model', { ascending: true })
      .range(from, from + EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取车间杂项材料库存导出数据失败')
    }

    const pageRows = (data || []) as WorkshopMiscMaterialsInventory[]
    rows.push(...pageRows)

    if (pageRows.length < EXPORT_PAGE_SIZE) {
      break
    }

    from += EXPORT_PAGE_SIZE
  }

  return rows
}

export async function updateWorkshopMiscMaterialsInventory({
  id,
  values,
}: {
  id: string
  values: WorkshopMiscMaterialsInventoryFormValues
}) {
  assertNonNegativeInteger(values.raw_material_quantity, '原材料数量')
  assertNonNegativeInteger(values.semi_finished_quantity, '半成品数量')
  assertNonNegativeInteger(values.finished_quantity, '成品数量')

  const { error } = await supabase
    .from('workshop_misc_materials_inventory')
    .update({
      raw_material_quantity: values.raw_material_quantity,
      semi_finished_quantity: values.semi_finished_quantity,
      finished_quantity: values.finished_quantity,
      remarks: (values.remarks ?? '').trim(),
    })
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新车间杂项材料库存失败')
  }
}

/** 按 型号 + 客户型号 + 规格 + 类别 匹配已有库存行，覆盖三项数量与备注；资料不存在时整体拒绝 */
export async function updateWorkshopMiscMaterialsInventoryBatch(
  rows: WorkshopMiscMaterialsInventoryImportRow[],
) {
  if (rows.length === 0) {
    return
  }

  const seenKeys = new Set<string>()
  for (const row of rows) {
    assertNonNegativeInteger(row.raw_material_quantity, '原材料数量')
    assertNonNegativeInteger(row.semi_finished_quantity, '半成品数量')
    assertNonNegativeInteger(row.finished_quantity, '成品数量')

    const key = workshopMiscMaterialsKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(`${describeWorkshopMiscMaterial(row)}在 Excel 中重复，无法导入`)
    }
    seenKeys.add(key)
  }

  const models = Array.from(new Set(rows.map(row => row.model)))
  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('workshop_misc_materials_inventory')
    .select('id, material_data_id, model, customer_model, specification, category')
    .in('model', models)

  if (inventoryError) {
    throw handleApiError(inventoryError, '检查车间杂项材料库存失败')
  }

  const inventoryByKey = new Map(
    (inventoryRows || []).map(row => [workshopMiscMaterialsKeyOf(row), row]),
  )

  const missing = rows.filter(row => !inventoryByKey.has(workshopMiscMaterialsKeyOf(row)))
  if (missing.length > 0) {
    const labels = missing
      .map(row => describeWorkshopMiscMaterial(row))
      .join('、')
    throw new Error(`以下材料在材料资料中不存在，请先维护材料资料：${labels}`)
  }

  const payload = rows.map((row) => {
    const matched = inventoryByKey.get(workshopMiscMaterialsKeyOf(row))!
    return {
      id: matched.id,
      material_data_id: matched.material_data_id,
      model: matched.model,
      customer_model: matched.customer_model,
      specification: matched.specification,
      category: matched.category,
      raw_material_quantity: row.raw_material_quantity,
      semi_finished_quantity: row.semi_finished_quantity,
      finished_quantity: row.finished_quantity,
      remarks: row.remarks.trim(),
    }
  })

  const { error } = await supabase
    .from('workshop_misc_materials_inventory')
    .upsert(payload)

  if (error) {
    throw handleApiError(error, '批量导入车间杂项材料库存失败')
  }
}

export async function getWorkshopMiscMaterialsInventoryOptions(
  keyword?: string,
): Promise<WorkshopMiscMaterialsInventoryOption[]> {
  let query = supabase
    .from('workshop_misc_materials_inventory')
    .select(
      'id, model, customer_model, specification, category, raw_material_quantity, semi_finished_quantity, finished_quantity, total_quantity',
    )

  query = applyWorkshopMiscMaterialsKeyword(query, keyword)

  const { data, error } = await query
    .order('model', { ascending: true })
    .order('customer_model', { ascending: true })
    .order('specification', { ascending: true })
    .limit(50)

  if (error)
    throw handleApiError(error, '获取车间杂项材料库存选项失败')
  return (data ?? []) as WorkshopMiscMaterialsInventoryOption[]
}
