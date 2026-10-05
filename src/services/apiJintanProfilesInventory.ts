import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanProfilesInventory {
  id: string
  profile_data_id: string
  profile_model: string
  profile_name: string
  specification: string
  material: string
  quantity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanProfilesInventoryFormValues {
  quantity: number
  remarks: string
}

export interface JintanProfilesInventoryImportRow {
  profile_model: string
  profile_name: string
  specification: string
  quantity: number
  remarks: string
}

const JINTAN_PROFILES_INVENTORY_EXPORT_PAGE_SIZE = 1000

function normalizeFormValues(
  values: JintanProfilesInventoryFormValues,
): JintanProfilesInventoryFormValues {
  return {
    quantity: values.quantity,
    remarks: values.remarks.trim(),
  }
}

function inventoryKeyOf(row: {
  profile_model: string
  profile_name: string
  specification: string
}): string {
  return `${row.profile_model}\u0000${row.profile_name}\u0000${row.specification}`
}

function keywordFilter(keyword: string) {
  return `profile_model.ilike.%${keyword}%,profile_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%`
}

export async function getJintanProfilesInventoryList({
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
    .from('jintan_profiles_inventory')
    .select('*', { count: 'exact' })

  if (keyword) {
    query = query.or(keywordFilter(keyword.trim()))
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('profile_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取型材库存列表失败')
  }

  return {
    items: (data || []) as JintanProfilesInventory[],
    total: count || 0,
  }
}

export async function getJintanProfilesInventoryForExport(keyword?: string) {
  const rows: JintanProfilesInventory[] = []
  let from = 0

  while (true) {
    let query = supabase.from('jintan_profiles_inventory').select('*')

    if (keyword) {
      query = query.or(keywordFilter(keyword.trim()))
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('profile_name', { ascending: true })
      .range(from, from + JINTAN_PROFILES_INVENTORY_EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取型材库存导出数据失败')
    }

    const pageRows = (data || []) as JintanProfilesInventory[]
    rows.push(...pageRows)

    if (pageRows.length < JINTAN_PROFILES_INVENTORY_EXPORT_PAGE_SIZE) {
      break
    }

    from += JINTAN_PROFILES_INVENTORY_EXPORT_PAGE_SIZE
  }

  return rows
}

export async function updateJintanProfilesInventory({
  id,
  values,
}: {
  id: string
  values: JintanProfilesInventoryFormValues
}) {
  const payload = normalizeFormValues(values)

  const { error } = await supabase
    .from('jintan_profiles_inventory')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新型材库存失败')
  }
}

export async function createJintanProfilesInventoryBatch(
  rows: JintanProfilesInventoryImportRow[],
) {
  if (rows.length === 0) {
    return
  }

  const seenKeys = new Set<string>()
  for (const row of rows) {
    const key = inventoryKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(
        `型号“${row.profile_model}”名称“${row.profile_name}”规格“${row.specification}”在 Excel 中重复，无法导入`,
      )
    }
    seenKeys.add(key)
  }

  const profileNames = Array.from(new Set(rows.map((row) => row.profile_name)))
  const { data: inventoryRows, error: inventoryError } = await supabase
    .from('jintan_profiles_inventory')
    .select(
      'id, profile_data_id, profile_model, profile_name, specification, material',
    )
    .in('profile_name', profileNames)

  if (inventoryError) {
    throw handleApiError(inventoryError, '检查型材库存失败')
  }

  const inventoryByKey = new Map(
    (inventoryRows || []).map((row) => [inventoryKeyOf(row), row]),
  )

  const missing = rows.filter((row) => !inventoryByKey.has(inventoryKeyOf(row)))
  if (missing.length > 0) {
    const labels = missing
      .map(
        (row) =>
          `“${row.profile_model}”/“${row.profile_name}”/“${row.specification}”`,
      )
      .join('、')
    throw new Error(`以下型材在型材资料中不存在，请先维护型材资料：${labels}`)
  }

  const payload = rows.map((row) => {
    const matched = inventoryByKey.get(inventoryKeyOf(row))
    if (!matched) {
      throw new Error(
        `未找到型号“${row.profile_model}”名称“${row.profile_name}”规格“${row.specification}”的库存行，请刷新后重试`,
      )
    }

    return {
      id: matched.id,
      profile_data_id: matched.profile_data_id,
      profile_model: matched.profile_model,
      profile_name: matched.profile_name,
      specification: matched.specification,
      material: matched.material,
      quantity: row.quantity,
      remarks: row.remarks.trim(),
    }
  })

  const { error } = await supabase
    .from('jintan_profiles_inventory')
    .upsert(payload)

  if (error) {
    throw handleApiError(error, '批量导入型材库存失败')
  }
}

export interface JintanProfilesInventoryOption {
  id: string
  profile_model: string
  profile_name: string
  specification: string
  material: string
  quantity: number
}

export async function getJintanProfilesInventoryOptions(
  keyword?: string,
): Promise<JintanProfilesInventoryOption[]> {
  let query = supabase
    .from('jintan_profiles_inventory')
    .select(
      'id, profile_model, profile_name, specification, material, quantity',
    )
  if (keyword?.trim()) query = query.or(keywordFilter(keyword.trim()))

  const { data, error } = await query
    .order('profile_name', { ascending: true })
    .order('profile_model', { ascending: true })
    .limit(50)

  if (error) throw handleApiError(error, '获取型材库存选项失败')
  return data ?? []
}
