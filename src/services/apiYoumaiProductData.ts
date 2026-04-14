import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface YoumaiProductData {
  id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
  remarks: string
  created_at: string
  updated_at: string
}

export interface YoumaiProductDataFormValues {
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
  remarks: string
}

type YoumaiProductDataTable = {
  from: (table: string) => any
}

function youmaiProductDataTable() {
  return (supabase as unknown as YoumaiProductDataTable).from(
    'youmai_product_data',
  )
}

function normalizePayload(
  values: YoumaiProductDataFormValues,
): YoumaiProductDataFormValues {
  return {
    material_code: values.material_code.trim(),
    material_name: values.material_name.trim(),
    model: values.model.trim(),
    specification: values.specification.trim(),
    specific_gravity: Number(values.specific_gravity ?? 0),
    remarks: values.remarks.trim(),
  }
}

async function checkYoumaiProductDataExists(
  materialCode: string,
  excludeId?: string,
) {
  let query = youmaiProductDataTable()
    .select('id')
    .eq('material_code', materialCode)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查物料编码是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getYoumaiProductDataList({
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

  let query = youmaiProductDataTable().select('*', { count: 'exact' })

  if (keyword) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `material_code.ilike.%${normalizedKeyword}%,material_name.ilike.%${normalizedKeyword}%,model.ilike.%${normalizedKeyword}%,specification.ilike.%${normalizedKeyword}%`,
    )
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('material_code', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取优迈货品资料列表失败')
  }

  return {
    items: (data || []) as YoumaiProductData[],
    total: count || 0,
  }
}

export async function createYoumaiProductData(
  values: YoumaiProductDataFormValues,
) {
  const payload = normalizePayload(values)

  const exists = await checkYoumaiProductDataExists(payload.material_code)
  if (exists) {
    throw new Error(`物料编码“${payload.material_code}”已存在，无法创建`)
  }

  const { error } = await youmaiProductDataTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建优迈货品资料失败')
  }
}

export async function createYoumaiProductDataBatch(
  rows: YoumaiProductDataFormValues[],
) {
  const payload = rows.map(normalizePayload)

  const materialCodeSet = new Set<string>()
  for (const row of payload) {
    if (materialCodeSet.has(row.material_code)) {
      throw new Error(`Excel 中存在重复物料编码“${row.material_code}”`)
    }
    materialCodeSet.add(row.material_code)
  }

  const materialCodes = payload.map((row) => row.material_code)
  const { data: existingRows, error: existingError } =
    await youmaiProductDataTable()
      .select('material_code')
      .in('material_code', materialCodes)

  if (existingError) {
    throw handleApiError(existingError, '检查物料编码是否存在失败')
  }

  if ((existingRows || []).length > 0) {
    const duplicateCodes = (existingRows || [])
      .map((row: { material_code: string }) => row.material_code)
      .join('、')
    throw new Error(`以下物料编码已存在，无法导入：${duplicateCodes}`)
  }

  const { error } = await youmaiProductDataTable().insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入优迈货品资料失败')
  }
}

export async function updateYoumaiProductData({
  id,
  values,
}: {
  id: string
  values: YoumaiProductDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkYoumaiProductDataExists(payload.material_code, id)
  if (exists) {
    throw new Error(`物料编码“${payload.material_code}”已存在，无法更新`)
  }

  const { error } = await youmaiProductDataTable().update(payload).eq('id', id)

  if (error) {
    throw handleApiError(error, '更新优迈货品资料失败')
  }
}

export async function deleteYoumaiProductData(ids: string[]) {
  const { error } = await youmaiProductDataTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除优迈货品资料失败')
  }
}
