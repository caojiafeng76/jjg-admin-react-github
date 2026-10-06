import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanMaterialsInventory {
  id: string
  material_data_id: string
  material_model: string
  material_name: string
  specification: string
  material: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanMaterialsInventoryFormValues {
  quantity: number
  remarks: string
}

export interface JintanMaterialsInventoryImportRow {
  material_model: string
  material_name: string
  specification: string
  quantity: number
  remarks: string
}

const JINTAN_MATERIALS_INVENTORY_EXPORT_PAGE_SIZE = 1000

function normalizeFormValues(
  values: JintanMaterialsInventoryFormValues,
): JintanMaterialsInventoryFormValues {
  return {
    quantity: values.quantity,
    remarks: values.remarks.trim(),
  }
}

function inventoryKeyOf(row: {
  material_model: string
  material_name: string
  specification: string
}): string {
  return `${row.material_model}\u0000${row.material_name}\u0000${row.specification}`
}

function keywordFilter(keyword: string) {
  return `material_model.ilike.%${keyword}%,material_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%`
}

export async function getJintanMaterialsInventoryList({
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

  let query = supabase
    .from('jintan_materials_inventory')
    .select('*', { count: 'exact' })

  if (keyword) {
    query = query.or(keywordFilter(keyword.trim()))
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('material_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取素材库存列表失败')
  }

  return {
    items: (data || []) as JintanMaterialsInventory[],
    total: count || 0,
  }
}

export async function getJintanMaterialsInventoryForExport(keyword?: string) {
  const rows: JintanMaterialsInventory[] = []
  let from = 0

  while (true) {
    let query = supabase.from('jintan_materials_inventory').select('*')

    if (keyword) {
      query = query.or(keywordFilter(keyword.trim()))
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('material_name', { ascending: true })
      .range(from, from + JINTAN_MATERIALS_INVENTORY_EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取素材库存导出数据失败')
    }

    const pageRows = (data || []) as JintanMaterialsInventory[]
    rows.push(...pageRows)

    if (pageRows.length < JINTAN_MATERIALS_INVENTORY_EXPORT_PAGE_SIZE) {
      break
    }

    from += JINTAN_MATERIALS_INVENTORY_EXPORT_PAGE_SIZE
  }

  return rows
}

export async function updateJintanMaterialsInventory({
  id,
  values,
}: {
  id: string
  values: JintanMaterialsInventoryFormValues
}) {
  const payload = normalizeFormValues(values)

  const { error } = await supabase
    .from('jintan_materials_inventory')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新素材库存失败')
  }
}

export async function createJintanMaterialsInventoryBatch(
  rows: JintanMaterialsInventoryImportRow[],
) {
  if (rows.length === 0) {
    return
  }

  const seenKeys = new Set<string>()
  for (const row of rows) {
    const key = inventoryKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(
        `型号“${row.material_model}”名称“${row.material_name}”规格“${row.specification}”在 Excel 中重复，无法导入`,
      )
    }
    seenKeys.add(key)
  }

  const materialNames = Array.from(
    new Set(rows.map((row) => row.material_name)),
  )
  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('jintan_materials_inventory')
    .select(
      'id, material_data_id, material_model, material_name, specification, material',
    )
    .in('material_name', materialNames)

  if (inventoryError) {
    throw handleApiError(inventoryError, '检查素材库存失败')
  }

  const inventoryByKey = new Map(
    (inventoryRows || []).map((row) => [inventoryKeyOf(row), row]),
  )

  const missing = rows.filter((row) => !inventoryByKey.has(inventoryKeyOf(row)))
  if (missing.length > 0) {
    const labels = missing
      .map(
        (row) =>
          `“${row.material_model}”/“${row.material_name}”/“${row.specification}”`,
      )
      .join('、')
    throw new Error(`以下素材在素材资料中不存在，请先维护素材资料：${labels}`)
  }

  const payload = rows.map((row) => {
    const matched = inventoryByKey.get(inventoryKeyOf(row))
    if (!matched) {
      throw new Error(
        `未找到型号“${row.material_model}”名称“${row.material_name}”规格“${row.specification}”的库存行，请刷新后重试`,
      )
    }

    return {
      id: matched.id,
      material_data_id: matched.material_data_id,
      material_model: matched.material_model,
      material_name: matched.material_name,
      specification: matched.specification,
      material: matched.material,
      quantity: row.quantity,
      remarks: row.remarks.trim(),
    }
  })

  const { error } = await supabase
    .from('jintan_materials_inventory')
    .upsert(payload)

  if (error) {
    throw handleApiError(error, '批量导入素材库存失败')
  }
}

export interface JintanMaterialsInventoryOption {
  id: string
  material_model: string
  material_name: string
  specification: string
  material: string
  quantity: number
}

export async function getJintanMaterialsInventoryOptions(
  keyword?: string,
): Promise<JintanMaterialsInventoryOption[]> {
  let query = supabase
    .from('jintan_materials_inventory')
    .select(
      'id, material_model, material_name, specification, material, quantity',
    )
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))

  const { data, error } = await query
    .order('material_name', { ascending: true })
    .order('material_model', { ascending: true })
    .limit(50)

  if (error) throw handleApiError(error, '获取素材库存选项失败')
  return data ?? []
}
