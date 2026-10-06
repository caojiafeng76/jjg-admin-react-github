import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanMaterialsData {
  id: string
  material_model: string
  material_name: string
  specification: string
  material: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanMaterialsDataFormValues {
  material_model: string
  material_name: string
  specification: string
  material: string
  remarks: string
}

const JINTAN_MATERIALS_EXPORT_PAGE_SIZE = 1000

function normalizePayload(
  values: JintanMaterialsDataFormValues,
): JintanMaterialsDataFormValues {
  return {
    material_model: values.material_model.trim(),
    material_name: values.material_name.trim(),
    specification: values.specification.trim(),
    material: values.material.trim(),
    remarks: values.remarks.trim(),
  }
}

function materialsKeyOf(row: {
  material_model: string
  material_name: string
  specification: string
}): string {
  return `${row.material_model}\u0000${row.material_name}\u0000${row.specification}`
}

function keywordFilter(keyword: string) {
  return `material_model.ilike.%${keyword}%,material_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%`
}

async function checkJintanMaterialsDataExists(
  profileModel: string,
  profileName: string,
  specification: string,
  excludeId?: string,
) {
  let query = supabase
    .from('jintan_materials_data')
    .select('id')
    .eq('material_model', profileModel)
    .eq('material_name', profileName)
    .eq('specification', specification)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查素材是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getJintanMaterialsDataList({
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
    .from('jintan_materials_data')
    .select('*', { count: 'exact' })

  if (keyword) {
    query = query.or(keywordFilter(keyword.trim()))
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('material_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取素材资料列表失败')
  }

  return {
    items: (data || []) as JintanMaterialsData[],
    total: count || 0,
  }
}

export async function getJintanMaterialsDataForExport(keyword?: string) {
  const rows: JintanMaterialsData[] = []
  let from = 0

  while (true) {
    let query = supabase.from('jintan_materials_data').select('*')

    if (keyword) {
      query = query.or(keywordFilter(keyword.trim()))
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('material_name', { ascending: true })
      .range(from, from + JINTAN_MATERIALS_EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取素材资料导出数据失败')
    }

    const pageRows = (data || []) as JintanMaterialsData[]
    rows.push(...pageRows)

    if (pageRows.length < JINTAN_MATERIALS_EXPORT_PAGE_SIZE) {
      break
    }

    from += JINTAN_MATERIALS_EXPORT_PAGE_SIZE
  }

  return rows
}

export async function createJintanMaterialsData(
  values: JintanMaterialsDataFormValues,
) {
  const payload = normalizePayload(values)

  const exists = await checkJintanMaterialsDataExists(
    payload.material_model,
    payload.material_name,
    payload.specification,
  )
  if (exists) {
    throw new Error(
      `型号“${payload.material_model}”名称“${payload.material_name}”规格“${payload.specification}”已存在，无法创建`,
    )
  }

  const { error } = await supabase.from('jintan_materials_data').insert(payload)

  if (error) {
    throw handleApiError(error, '创建素材资料失败')
  }
}

export async function createJintanMaterialsDataBatch(
  rows: JintanMaterialsDataFormValues[],
) {
  const payload = rows.map(normalizePayload)

  const seenKeys = new Set<string>()
  for (const row of payload) {
    const key = materialsKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(
        `型号“${row.material_model}”名称“${row.material_name}”规格“${row.specification}”在 Excel 中重复，无法导入`,
      )
    }
    seenKeys.add(key)
  }

  const materialNames = Array.from(
    new Set(payload.map((row) => row.material_name)),
  )
  const { data: existingRows, error: existingError } = await supabase
    .from('jintan_materials_data')
    .select('material_model, material_name, specification')
    .in('material_name', materialNames)

  if (existingError) {
    throw handleApiError(existingError, '检查素材是否存在失败')
  }

  const existingKeys = new Set(
    (existingRows || []).map((row) => materialsKeyOf(row)),
  )
  const duplicated = payload.filter((row) =>
    existingKeys.has(materialsKeyOf(row)),
  )
  if (duplicated.length > 0) {
    const labels = duplicated
      .map(
        (row) =>
          `“${row.material_model}”/“${row.material_name}”/“${row.specification}”`,
      )
      .join('、')
    throw new Error(`以下素材已存在，无法导入：${labels}`)
  }

  const { error } = await supabase.from('jintan_materials_data').insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入素材资料失败')
  }
}

export async function updateJintanMaterialsData({
  id,
  values,
}: {
  id: string
  values: JintanMaterialsDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkJintanMaterialsDataExists(
    payload.material_model,
    payload.material_name,
    payload.specification,
    id,
  )
  if (exists) {
    throw new Error(
      `型号“${payload.material_model}”名称“${payload.material_name}”规格“${payload.specification}”已存在，无法更新`,
    )
  }

  const { error } = await supabase
    .from('jintan_materials_data')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新素材资料失败')
  }
}

export async function deleteJintanMaterialsData(ids: string[]) {
  const { error } = await supabase
    .from('jintan_materials_data')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除素材资料失败')
  }
}
