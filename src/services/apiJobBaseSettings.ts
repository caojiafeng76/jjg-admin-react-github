import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface JobBaseSetting {
  id: string
  job_name: string
  standard_income: number
  hourly_fee: number
  daily_work_hours: number
  working_days: number
  monthly_standard_hours: number
  created_at: string
  updated_at: string
}

export interface JobBaseSettingFormValues {
  job_name: string
  standard_income: number
  daily_work_hours: number
  working_days: number
}

type JobBaseSettingsTable = {
  from: (table: string) => any
}

function jobBaseSettingsTable() {
  return (supabase as unknown as JobBaseSettingsTable).from('job_base_settings')
}

function normalizePayload(
  values: JobBaseSettingFormValues,
): JobBaseSettingFormValues {
  return {
    job_name: values.job_name.trim(),
    standard_income: Number(values.standard_income ?? 0),
    daily_work_hours: Number(values.daily_work_hours ?? 0),
    working_days: Number(values.working_days ?? 0),
  }
}

async function checkJobBaseSettingExists(jobName: string, excludeId?: string) {
  let query = jobBaseSettingsTable()
    .select('id')
    .eq('job_name', jobName)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查岗位基础数值失败')
  }

  return (data?.length || 0) > 0
}

export async function getJobBaseSettings({
  page,
  pageSize,
  jobName,
}: {
  page: number
  pageSize: number
  jobName?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = jobBaseSettingsTable().select('*', { count: 'exact' })

  if (jobName) {
    query = query.ilike('job_name', `%${jobName}%`)
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('job_name', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取岗位基础数值列表失败')
  }

  return {
    items: (data || []) as JobBaseSetting[],
    total: count || 0,
  }
}

export async function createJobBaseSetting(values: JobBaseSettingFormValues) {
  const payload = normalizePayload(values)

  const exists = await checkJobBaseSettingExists(payload.job_name)
  if (exists) {
    throw new Error(`工种“${payload.job_name}”已存在，无法创建`)
  }

  const { error } = await jobBaseSettingsTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建岗位基础数值失败')
  }
}

export async function updateJobBaseSetting({
  id,
  values,
}: {
  id: string
  values: JobBaseSettingFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkJobBaseSettingExists(payload.job_name, id)
  if (exists) {
    throw new Error(`工种“${payload.job_name}”已存在，无法更新`)
  }

  const { error } = await jobBaseSettingsTable().update(payload).eq('id', id)

  if (error) {
    throw handleApiError(error, '更新岗位基础数值失败')
  }
}

export async function deleteJobBaseSettings(ids: string[]) {
  const { error } = await jobBaseSettingsTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除岗位基础数值失败')
  }
}
