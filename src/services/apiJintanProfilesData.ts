import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JintanProfilesData {
  id: string
  profile_model: string
  profile_name: string
  specification: string
  material: string
  remarks: string
  created_at: string
  updated_at: string
}

export interface JintanProfilesDataFormValues {
  profile_model: string
  profile_name: string
  specification: string
  material: string
  remarks: string
}

const JINTAN_PROFILES_EXPORT_PAGE_SIZE = 1000

function normalizePayload(
  values: JintanProfilesDataFormValues,
): JintanProfilesDataFormValues {
  return {
    profile_model: values.profile_model.trim(),
    profile_name: values.profile_name.trim(),
    specification: values.specification.trim(),
    material: values.material.trim(),
    remarks: values.remarks.trim(),
  }
}

function profilesKeyOf(row: {
  profile_model: string
  profile_name: string
  specification: string
}): string {
  return `${row.profile_model}\u0000${row.profile_name}\u0000${row.specification}`
}

function keywordFilter(keyword: string) {
  return `profile_model.ilike.%${keyword}%,profile_name.ilike.%${keyword}%,specification.ilike.%${keyword}%,material.ilike.%${keyword}%`
}

async function checkJintanProfilesDataExists(
  profileModel: string,
  profileName: string,
  specification: string,
  excludeId?: string,
) {
  let query = supabase
    .from('jintan_profiles_data')
    .select('id')
    .eq('profile_model', profileModel)
    .eq('profile_name', profileName)
    .eq('specification', specification)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查型材是否存在失败')
  }

  return (data?.length || 0) > 0
}

export async function getJintanProfilesDataList({
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
    .from('jintan_profiles_data')
    .select('*', { count: 'exact' })

  if (keyword) {
    query = query.or(keywordFilter(keyword.trim()))
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('profile_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取型材资料列表失败')
  }

  return {
    items: (data || []) as JintanProfilesData[],
    total: count || 0,
  }
}

export async function getJintanProfilesDataForExport(keyword?: string) {
  const rows: JintanProfilesData[] = []
  let from = 0

  while (true) {
    let query = supabase.from('jintan_profiles_data').select('*')

    if (keyword) {
      query = query.or(keywordFilter(keyword.trim()))
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .order('profile_name', { ascending: true })
      .range(from, from + JINTAN_PROFILES_EXPORT_PAGE_SIZE - 1)

    if (error) {
      throw handleApiError(error, '获取型材资料导出数据失败')
    }

    const pageRows = (data || []) as JintanProfilesData[]
    rows.push(...pageRows)

    if (pageRows.length < JINTAN_PROFILES_EXPORT_PAGE_SIZE) {
      break
    }

    from += JINTAN_PROFILES_EXPORT_PAGE_SIZE
  }

  return rows
}

export async function createJintanProfilesData(
  values: JintanProfilesDataFormValues,
) {
  const payload = normalizePayload(values)

  const exists = await checkJintanProfilesDataExists(
    payload.profile_model,
    payload.profile_name,
    payload.specification,
  )
  if (exists) {
    throw new Error(
      `型号“${payload.profile_model}”名称“${payload.profile_name}”规格“${payload.specification}”已存在，无法创建`,
    )
  }

  const { error } = await supabase.from('jintan_profiles_data').insert(payload)

  if (error) {
    throw handleApiError(error, '创建型材资料失败')
  }
}

export async function createJintanProfilesDataBatch(
  rows: JintanProfilesDataFormValues[],
) {
  const payload = rows.map(normalizePayload)

  const seenKeys = new Set<string>()
  for (const row of payload) {
    const key = profilesKeyOf(row)
    if (seenKeys.has(key)) {
      throw new Error(
        `型号“${row.profile_model}”名称“${row.profile_name}”规格“${row.specification}”在 Excel 中重复，无法导入`,
      )
    }
    seenKeys.add(key)
  }

  const profileNames = Array.from(
    new Set(payload.map((row) => row.profile_name)),
  )
  const { data: existingRows, error: existingError } = await supabase
    .from('jintan_profiles_data')
    .select('profile_model, profile_name, specification')
    .in('profile_name', profileNames)

  if (existingError) {
    throw handleApiError(existingError, '检查型材是否存在失败')
  }

  const existingKeys = new Set(
    (existingRows || []).map((row) => profilesKeyOf(row)),
  )
  const duplicated = payload.filter((row) =>
    existingKeys.has(profilesKeyOf(row)),
  )
  if (duplicated.length > 0) {
    const labels = duplicated
      .map(
        (row) =>
          `“${row.profile_model}”/“${row.profile_name}”/“${row.specification}”`,
      )
      .join('、')
    throw new Error(`以下型材已存在，无法导入：${labels}`)
  }

  const { error } = await supabase.from('jintan_profiles_data').insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入型材资料失败')
  }
}

export async function updateJintanProfilesData({
  id,
  values,
}: {
  id: string
  values: JintanProfilesDataFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkJintanProfilesDataExists(
    payload.profile_model,
    payload.profile_name,
    payload.specification,
    id,
  )
  if (exists) {
    throw new Error(
      `型号“${payload.profile_model}”名称“${payload.profile_name}”规格“${payload.specification}”已存在，无法更新`,
    )
  }

  const { error } = await supabase
    .from('jintan_profiles_data')
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新型材资料失败')
  }
}

export async function deleteJintanProfilesData(ids: string[]) {
  const { error } = await supabase
    .from('jintan_profiles_data')
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除型材资料失败')
  }
}
