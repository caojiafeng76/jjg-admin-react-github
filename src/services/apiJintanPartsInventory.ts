import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanPartsInventory {
  id: string
  part_data_id: string
  part_name: string
  specification: string
  material: string
  supplier: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanPartsInventoryFormValues {
  quantity: number
  remarks: string
}

export interface JintanPartsInventoryImportRow {
  part_name: string
  specification: string
  quantity: number
  remarks: string
}

const JINTAN_PARTS_INVENTORY_EXPORT_PAGE_SIZE = 1000

function normalizeFormValues(
  values: JintanPartsInventoryFormValues,
): JintanPartsInventoryFormValues {
  return {
    quantity: values.quantity,
    remarks: values.remarks.trim(),
  }
}

function inventoryKeyOf(row: {
  part_name: string
  specification: string
}): string {
  return `${row.part_name}\u0000${row.specification}`
}

function keywordFilter(keyword: string) {
  return `part_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%,supplier.ilike.%${keyword}%`
}

export async function getJintanPartsInventoryList({
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
    .from('jintan_parts_inventory')
    .select('*', { count: 'exact' })

  if (keyword) {
    query = query.or(keywordFilter(keyword.trim()))
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('part_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取配件库存列表失败')
  }

  return {
    items: (data || []) as JintanPartsInventory[],
    total: count || 0,
  }
}

export async function getJintanPartsInventoryForExport(keyword?: string) {
  const rows: JintanPartsInventory[] = []
  let from = 0

  while (true) {
    let query = supabase.from('jintan_parts_inventory').select('*')

    if (keyword) {
      query = query.or(keywordFilter(keyword.trim()))
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('part_name', { ascending: true })
      .range(from, from + JINTAN_PARTS_INVENTORY_EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取配件库存导出数据失败')
    }

    const pageRows = (data || []) as JintanPartsInventory[]
    rows.push(...pageRows)

    if (pageRows.length < JINTAN_PARTS_INVENTORY_EXPORT_PAGE_SIZE) {
      break
    }

    from += JINTAN_PARTS_INVENTORY_EXPORT_PAGE_SIZE
  }

  return rows
}

export async function updateJintanPartsInventory({
  id,
  values,
}: {
  id: string
  values: JintanPartsInventoryFormValues
}) {
  const payload = normalizeFormValues(values)

  const { error } = await supabase
    .from('jintan_parts_inventory')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新配件库存失败')
  }
}

export async function createJintanPartsInventoryBatch(
  rows: JintanPartsInventoryImportRow[],
) {
  if (rows.length === 0) {
    return
  }

  const seenKeys = new Set<string>()
  for (const row of rows) {
    const key = inventoryKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(
        `名称“${row.part_name}”规格“${row.specification}”在 Excel 中重复，无法导入`,
      )
    }
    seenKeys.add(key)
  }

  const partNames = Array.from(new Set(rows.map((row) => row.part_name)))
  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('jintan_parts_inventory')
    .select('id, part_data_id, part_name, specification, material, supplier')
    .in('part_name', partNames)

  if (inventoryError) {
    throw handleApiError(inventoryError, '检查配件库存失败')
  }

  const inventoryByKey = new Map(
    (inventoryRows || []).map((row) => [inventoryKeyOf(row), row]),
  )

  const missing = rows.filter((row) => !inventoryByKey.has(inventoryKeyOf(row)))
  if (missing.length > 0) {
    const labels = missing
      .map((row) => `“${row.part_name}”/“${row.specification}”`)
      .join('、')
    throw new Error(`以下配件在配件资料中不存在，请先维护配件资料：${labels}`)
  }

  const payload = rows.map((row) => {
    const matched = inventoryByKey.get(inventoryKeyOf(row))
    if (!matched) {
      throw new Error(
        `未找到名称“${row.part_name}”规格“${row.specification}”的库存行，请刷新后重试`,
      )
    }

    return {
      id: matched.id,
      part_data_id: matched.part_data_id,
      part_name: matched.part_name,
      specification: matched.specification,
      material: matched.material,
      supplier: matched.supplier,
      quantity: row.quantity,
      remarks: row.remarks.trim(),
    }
  })

  const { error } = await supabase
    .from('jintan_parts_inventory')
    .upsert(payload)

  if (error) {
    throw handleApiError(error, '批量导入配件库存失败')
  }
}

export interface JintanPartsInventoryOption {
  id: string
  part_name: string
  specification: string
  material: string
  supplier: string
  quantity: number
}

export async function getJintanPartsInventoryOptions(
  keyword?: string,
): Promise<JintanPartsInventoryOption[]> {
  let query = supabase
    .from('jintan_parts_inventory')
    .select('id, part_name, specification, material, supplier, quantity')
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))

  const { data, error } = await query
    .order('part_name', { ascending: true })
    .limit(50)

  if (error) throw handleApiError(error, '获取配件库存选项失败')
  return data ?? []
}
