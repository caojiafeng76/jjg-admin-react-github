import type { SyneyMaterialsSearchFilters } from './syneyMaterialsSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import { applyJintanSearchFilters } from './jintanSearchFields'
import supabase from './supabase'
import { SYNEY_MATERIALS_SEARCH_FIELDS } from './syneyMaterialsSearchFields'

export interface SyneyMaterialsData {
  id: string
  material_name: string
  specification: string
  unit: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface SyneyMaterialsDataFormValues {
  material_name: string
  specification: string
  unit: string
  remarks: string
}

const EXPORT_PAGE_SIZE = 1000

function normalizePayload(
  values: SyneyMaterialsDataFormValues,
): SyneyMaterialsDataFormValues {
  return {
    material_name: values.material_name.trim(),
    specification: (values.specification ?? '').trim(),
    unit: values.unit.trim(),
    remarks: (values.remarks ?? '').trim(),
  }
}

/** 判重键：品名 + 规格 */
export function syneyMaterialsKeyOf(row: {
  material_name: string
  specification: string
}): string {
  return `${row.material_name}\u0000${row.specification}`
}

export function describeSyneyMaterial(row: {
  material_name: string
  specification: string
}): string {
  return `品名“${row.material_name}”规格“${row.specification || '无'}”`
}

async function checkSyneyMaterialsDataExists(
  materialName: string,
  specification: string,
  excludeId?: string,
) {
  let query = supabase
    .from('syney_materials_data')
    .select('id')
    .eq('material_name', materialName)
    .eq('specification', specification)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查材料是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getSyneyMaterialsDataList({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: SyneyMaterialsSearchFilters
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('syney_materials_data')
    .select('*', { count: 'exact' })

  query = applyJintanSearchFilters(query, filters, SYNEY_MATERIALS_SEARCH_FIELDS)

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('material_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取材料资料列表失败')
  }

  return {
    items: (data || []) as SyneyMaterialsData[],
    total: count || 0,
  }
}

export async function getSyneyMaterialsDataForExport(
  filters?: SyneyMaterialsSearchFilters,
) {
  const rows: SyneyMaterialsData[] = []
  let from = 0

  while (true) {
    let query = supabase.from('syney_materials_data').select('*')
    query = applyJintanSearchFilters(query, filters, SYNEY_MATERIALS_SEARCH_FIELDS)

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('material_name', { ascending: true })
      .range(from, from + EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取材料资料导出数据失败')
    }

    const pageRows = (data || []) as SyneyMaterialsData[]
    rows.push(...pageRows)

    if (pageRows.length < EXPORT_PAGE_SIZE) {
      break
    }

    from += EXPORT_PAGE_SIZE
  }

  return rows
}

export async function createSyneyMaterialsData(
  values: SyneyMaterialsDataFormValues,
) {
  const payload = normalizePayload(values)

  const exists = await checkSyneyMaterialsDataExists(
    payload.material_name,
    payload.specification,
  )
  if (exists) {
    throw new Error(`${describeSyneyMaterial(payload)}已存在，无法创建`)
  }

  const { error } = await supabase.from('syney_materials_data').insert(payload)

  if (error) {
    throw handleApiError(error, '创建材料资料失败')
  }
}

export async function createSyneyMaterialsDataBatch(
  rows: SyneyMaterialsDataFormValues[],
) {
  const payload = rows.map(normalizePayload)

  const seenKeys = new Set<string>()
  for (const row of payload) {
    const key = syneyMaterialsKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(`${describeSyneyMaterial(row)}在 Excel 中重复，无法导入`)
    }
    seenKeys.add(key)
  }

  const materialNames = Array.from(new Set(payload.map(row => row.material_name)))
  const { data: existingRows, error: existingError } = await supabase
    .from('syney_materials_data')
    .select('material_name, specification')
    .in('material_name', materialNames)

  if (existingError) {
    throw handleApiError(existingError, '检查材料是否存在失败')
  }

  const existingKeys = new Set(
    (existingRows || []).map(row => syneyMaterialsKeyOf(row)),
  )
  const duplicated = payload.filter(row =>
    existingKeys.has(syneyMaterialsKeyOf(row)),
  )
  if (duplicated.length > 0) {
    const labels = duplicated
      .map(row => `“${row.material_name}”/“${row.specification}”`)
      .join('、')
    throw new Error(`以下材料已存在，无法导入：${labels}`)
  }

  const { error } = await supabase.from('syney_materials_data').insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入材料资料失败')
  }
}

export async function updateSyneyMaterialsData({
  id,
  values,
}: {
  id: string
  values: SyneyMaterialsDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkSyneyMaterialsDataExists(
    payload.material_name,
    payload.specification,
    id,
  )
  if (exists) {
    throw new Error(`${describeSyneyMaterial(payload)}已存在，无法更新`)
  }

  const { error } = await supabase
    .from('syney_materials_data')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新材料资料失败')
  }
}

export async function deleteSyneyMaterialsData(ids: string[]) {
  const { error } = await supabase
    .from('syney_materials_data')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除材料资料失败')
  }
}
