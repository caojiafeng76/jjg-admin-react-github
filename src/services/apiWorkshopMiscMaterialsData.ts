import type { WorkshopMiscMaterialsSearchFilters } from './workshopMiscMaterialsSearchFields'
import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'
import { applyWorkshopMiscMaterialsSearchFilters } from './workshopMiscMaterialsSearchFields'

export interface WorkshopMiscMaterialsData {
  id: string
  model: string
  customer_model: string
  specification: string
  category: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface WorkshopMiscMaterialsDataFormValues {
  model: string
  customer_model: string
  specification: string
  category: string
  remarks: string
}

const EXPORT_PAGE_SIZE = 1000

function normalizePayload(
  values: WorkshopMiscMaterialsDataFormValues,
): WorkshopMiscMaterialsDataFormValues {
  return {
    model: values.model.trim(),
    customer_model: (values.customer_model ?? '').trim(),
    specification: (values.specification ?? '').trim(),
    category: (values.category ?? '').trim(),
    remarks: (values.remarks ?? '').trim(),
  }
}

/** 判重键：型号 + 客户型号 + 规格 + 类别 */
export function workshopMiscMaterialsKeyOf(row: {
  model: string
  customer_model: string
  specification: string
  category: string
}): string {
  return `${row.model}\u0000${row.customer_model}\u0000${row.specification}\u0000${row.category}`
}

export function describeWorkshopMiscMaterial(row: {
  model: string
  customer_model: string
  specification: string
  category: string
}): string {
  return `型号“${row.model}”客户型号“${row.customer_model || '无'}”规格“${row.specification || '无'}”类别“${row.category || '无'}”`
}

async function checkWorkshopMiscMaterialsDataExists(
  payload: Pick<
    WorkshopMiscMaterialsDataFormValues,
    'model' | 'customer_model' | 'specification' | 'category'
  >,
  excludeId?: string,
) {
  let query = supabase
    .from('workshop_misc_materials_data')
    .select('id')
    .eq('model', payload.model)
    .eq('customer_model', payload.customer_model)
    .eq('specification', payload.specification)
    .eq('category', payload.category)
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

export async function getWorkshopMiscMaterialsDataList({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: WorkshopMiscMaterialsSearchFilters
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('workshop_misc_materials_data')
    .select('*', { count: 'exact' })

  query = applyWorkshopMiscMaterialsSearchFilters(query, filters)

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('model', { ascending: true })
    .order('customer_model', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取车间杂项材料资料列表失败')
  }

  return {
    items: (data || []) as WorkshopMiscMaterialsData[],
    total: count || 0,
  }
}

export async function getWorkshopMiscMaterialsDataForExport(
  filters?: WorkshopMiscMaterialsSearchFilters,
) {
  const rows: WorkshopMiscMaterialsData[] = []
  let from = 0

  while (true) {
    let query = supabase.from('workshop_misc_materials_data').select('*')
    query = applyWorkshopMiscMaterialsSearchFilters(query, filters)

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('model', { ascending: true })
      .order('customer_model', { ascending: true })
      .range(from, from + EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取车间杂项材料资料导出数据失败')
    }

    const pageRows = (data || []) as WorkshopMiscMaterialsData[]
    rows.push(...pageRows)

    if (pageRows.length < EXPORT_PAGE_SIZE) {
      break
    }

    from += EXPORT_PAGE_SIZE
  }

  return rows
}

/** 获取历史已填的非空类别清单，供表单联想与筛选使用 */
export async function getWorkshopMiscMaterialsCategories(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_workshop_misc_materials_categories')

  if (error) {
    throw handleApiError(error, '获取车间杂项材料类别列表失败')
  }

  return (data ?? [])
    .map(row => row.category)
    .filter((category): category is string => Boolean(category && category.trim()))
}

export async function createWorkshopMiscMaterialsData(
  values: WorkshopMiscMaterialsDataFormValues,
) {
  const payload = normalizePayload(values)

  const exists = await checkWorkshopMiscMaterialsDataExists(payload)
  if (exists) {
    throw new Error(`${describeWorkshopMiscMaterial(payload)}已存在，无法创建`)
  }

  const { error } = await supabase
    .from('workshop_misc_materials_data')
    .insert(payload)

  if (error) {
    throw handleApiError(error, '创建车间杂项材料资料失败')
  }
}

export async function createWorkshopMiscMaterialsDataBatch(
  rows: WorkshopMiscMaterialsDataFormValues[],
) {
  const payload = rows.map(normalizePayload)

  const seenKeys = new Set<string>()
  for (const row of payload) {
    const key = workshopMiscMaterialsKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(`${describeWorkshopMiscMaterial(row)}在 Excel 中重复，无法导入`)
    }
    seenKeys.add(key)
  }

  const models = Array.from(new Set(payload.map(row => row.model)))
  const { data: existingRows, error: existingError } = await supabase
    .from('workshop_misc_materials_data')
    .select('model, customer_model, specification, category')
    .in('model', models)

  if (existingError) {
    throw handleApiError(existingError, '检查材料是否存在失败')
  }

  const existingKeys = new Set(
    (existingRows || []).map(row => workshopMiscMaterialsKeyOf(row)),
  )
  const duplicated = payload.filter(row =>
    existingKeys.has(workshopMiscMaterialsKeyOf(row)),
  )
  if (duplicated.length > 0) {
    const labels = duplicated
      .map(row => describeWorkshopMiscMaterial(row))
      .join('、')
    throw new Error(`以下材料已存在，无法导入：${labels}`)
  }

  const { error } = await supabase
    .from('workshop_misc_materials_data')
    .insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入车间杂项材料资料失败')
  }
}

export async function updateWorkshopMiscMaterialsData({
  id,
  values,
}: {
  id: string
  values: WorkshopMiscMaterialsDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkWorkshopMiscMaterialsDataExists(payload, id)
  if (exists) {
    throw new Error(`${describeWorkshopMiscMaterial(payload)}已存在，无法更新`)
  }

  const { error } = await supabase
    .from('workshop_misc_materials_data')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新车间杂项材料资料失败')
  }
}

export async function deleteWorkshopMiscMaterialsData(ids: string[]) {
  const { error } = await supabase
    .from('workshop_misc_materials_data')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除车间杂项材料资料失败')
  }
}
