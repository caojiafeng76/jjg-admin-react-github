import type { JintanItemType } from './jintanItemType'
import type { JintanSearchFilters } from './jintanSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import { describeJintanColor } from './jintanColor'
import { applyJintanSearchFilters, JINTAN_PARTS_SEARCH_FIELDS } from './jintanSearchFields'
import supabase from './supabase'

export interface JintanPartsData {
  id: string
  item_type: JintanItemType
  part_name: string
  specification: string
  color: string
  material: string
  supplier: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanPartsDataFormValues {
  item_type: JintanItemType
  part_name: string
  specification: string
  color: string
  material: string
  supplier: string
  remarks: string
}

const JINTAN_PARTS_EXPORT_PAGE_SIZE = 1000

function normalizePayload(
  values: JintanPartsDataFormValues,
): JintanPartsDataFormValues {
  return {
    item_type: values.item_type,
    part_name: values.part_name.trim(),
    specification: values.specification.trim(),
    color: (values.color ?? '').trim(),
    material: values.material.trim(),
    supplier: values.supplier.trim(),
    remarks: values.remarks.trim(),
  }
}

function partsKeyOf(row: {
  item_type: string
  part_name: string
  specification: string
  color: string
}): string {
  return `${row.item_type}\u0000${row.part_name}\u0000${row.specification}\u0000${row.color}`
}

async function checkJintanPartsDataExists(
  itemType: JintanItemType,
  partName: string,
  specification: string,
  color: string,
  excludeId?: string,
) {
  let query = supabase
    .from('jintan_parts_data')
    .select('id')
    .eq('item_type', itemType)
    .eq('part_name', partName)
    .eq('specification', specification)
    .eq('color', color)
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
  filters,
  itemType,
}: {
  page: number
  pageSize: number
  filters?: JintanSearchFilters
  itemType?: JintanItemType
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('jintan_parts_data').select('*', { count: 'exact' })

  query = applyJintanSearchFilters(query, filters, JINTAN_PARTS_SEARCH_FIELDS)
  if (itemType) {
    query = query.eq('item_type', itemType)
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

export async function getJintanPartsDataForExport(
  filters?: JintanSearchFilters,
  itemType?: JintanItemType,
) {
  const rows: JintanPartsData[] = []
  let from = 0

  while (true) {
    let query = supabase.from('jintan_parts_data').select('*')

    query = applyJintanSearchFilters(query, filters, JINTAN_PARTS_SEARCH_FIELDS)
    if (itemType) {
      query = query.eq('item_type', itemType)
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
    payload.item_type,
    payload.part_name,
    payload.specification,
    payload.color,
  )
  if (exists) {
    throw new Error(
      `类型“${payload.item_type}”名称“${payload.part_name}”规格“${payload.specification}”${describeJintanColor(payload.color)}已存在，无法创建`,
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
        `类型“${row.item_type}”名称“${row.part_name}”规格“${row.specification}”${describeJintanColor(row.color)}重复，无法导入`,
      )
    }
    seenKeys.add(key)
  }

  const partNames = Array.from(new Set(payload.map(row => row.part_name)))
  const { data: existingRows, error: existingError } = await supabase
    .from('jintan_parts_data')
    .select('item_type, part_name, specification, color')
    .in('part_name', partNames)

  if (existingError) {
    throw handleApiError(existingError, '检查配件是否存在失败')
  }

  const existingKeys = new Set(
    (existingRows || []).map(row => partsKeyOf(row)),
  )
  const duplicated = payload.filter(row => existingKeys.has(partsKeyOf(row)))
  if (duplicated.length > 0) {
    const labels = duplicated
      .map(row => `“${row.item_type}”/“${row.part_name}”/“${row.specification}”${row.color ? `/“${row.color}”` : ''}`)
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
    payload.item_type,
    payload.part_name,
    payload.specification,
    payload.color,
    id,
  )
  if (exists) {
    throw new Error(
      `类型“${payload.item_type}”名称“${payload.part_name}”规格“${payload.specification}”${describeJintanColor(payload.color)}已存在，无法更新`,
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
