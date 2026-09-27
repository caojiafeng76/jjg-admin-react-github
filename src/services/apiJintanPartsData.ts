import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanPartsData {
  id: string
  part_name: string
  specification: string
  material: string
  supplier: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanPartsDataFormValues {
  part_name: string
  specification: string
  material: string
  supplier: string
  remarks: string
}

const JINTAN_PARTS_EXPORT_PAGE_SIZE = 1000

function normalizePayload(
  values: JintanPartsDataFormValues,
): JintanPartsDataFormValues {
  return {
    part_name: values.part_name.trim(),
    specification: values.specification.trim(),
    material: values.material.trim(),
    supplier: values.supplier.trim(),
    remarks: values.remarks.trim(),
  }
}

function partsKeyOf(row: {
  part_name: string
  specification: string
}): string {
  return `${row.part_name}\u0000${row.specification}`
}

function keywordFilter(keyword: string) {
  return `part_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%,supplier.ilike.%${keyword}%`
}

async function checkJintanPartsDataExists(
  partName: string,
  specification: string,
  excludeId?: string,
) {
  let query = supabase
    .from('jintan_parts_data')
    .select('id')
    .eq('part_name', partName)
    .eq('specification', specification)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查配件是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getJintanPartsDataList({
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

  let query = supabase.from('jintan_parts_data').select('*', { count: 'exact' })

  if (keyword) {
    query = query.or(keywordFilter(keyword.trim()))
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('part_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取配件资料列表失败')
  }

  return {
    items: (data || []) as JintanPartsData[],
    total: count || 0,
  }
}

export async function getJintanPartsDataForExport(keyword?: string) {
  const rows: JintanPartsData[] = []
  let from = 0

  while (true) {
    let query = supabase.from('jintan_parts_data').select('*')

    if (keyword) {
      query = query.or(keywordFilter(keyword.trim()))
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('part_name', { ascending: true })
      .range(from, from + JINTAN_PARTS_EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取配件资料导出数据失败')
    }

    const pageRows = (data || []) as JintanPartsData[]
    rows.push(...pageRows)

    if (pageRows.length < JINTAN_PARTS_EXPORT_PAGE_SIZE) {
      break
    }

    from += JINTAN_PARTS_EXPORT_PAGE_SIZE
  }

  return rows
}

export async function createJintanPartsData(values: JintanPartsDataFormValues) {
  const payload = normalizePayload(values)

  const exists = await checkJintanPartsDataExists(
    payload.part_name,
    payload.specification,
  )
  if (exists) {
    throw new Error(
      `名称“${payload.part_name}”规格“${payload.specification}”已存在，无法创建`,
    )
  }

  const { error } = await supabase.from('jintan_parts_data').insert(payload)

  if (error) {
    throw handleApiError(error, '创建配件资料失败')
  }
}

export async function createJintanPartsDataBatch(
  rows: JintanPartsDataFormValues[],
) {
  const payload = rows.map(normalizePayload)

  const seenKeys = new Set<string>()
  for (const row of payload) {
    const key = partsKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(
        `名称“${row.part_name}”规格“${row.specification}”重复，无法导入`,
      )
    }
    seenKeys.add(key)
  }

  const partNames = Array.from(new Set(payload.map((row) => row.part_name)))
  const { data: existingRows, error: existingError } = await supabase
    .from('jintan_parts_data')
    .select('part_name, specification')
    .in('part_name', partNames)

  if (existingError) {
    throw handleApiError(existingError, '检查配件是否存在失败')
  }

  const existingKeys = new Set(
    (existingRows || []).map((row) => partsKeyOf(row)),
  )
  const duplicated = payload.filter((row) => existingKeys.has(partsKeyOf(row)))
  if (duplicated.length > 0) {
    const labels = duplicated
      .map((row) => `“${row.part_name}”/“${row.specification}”`)
      .join('、')
    throw new Error(`以下配件已存在，无法导入：${labels}`)
  }

  const { error } = await supabase.from('jintan_parts_data').insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入配件资料失败')
  }
}

export async function updateJintanPartsData({
  id,
  values,
}: {
  id: string
  values: JintanPartsDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkJintanPartsDataExists(
    payload.part_name,
    payload.specification,
    id,
  )
  if (exists) {
    throw new Error(
      `名称“${payload.part_name}”规格“${payload.specification}”已存在，无法更新`,
    )
  }

  const { error } = await supabase
    .from('jintan_parts_data')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新配件资料失败')
  }
}

export async function deleteJintanPartsData(ids: string[]) {
  const { error } = await supabase
    .from('jintan_parts_data')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除配件资料失败')
  }
}
