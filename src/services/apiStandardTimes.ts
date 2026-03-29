import supabase from './supabase'
import dayjs from 'dayjs'
import { handleApiError } from '@/utils/errorHandler'
import type { Database } from './database.types'
import { getMachineEquipmentHourlyRate } from './apiMachineEquipmentMaintenances'

type ProcessStandardRow =
  Database['public']['Tables']['process_standards']['Row']
type ProcessStandardInsert =
  Database['public']['Tables']['process_standards']['Insert']

export type StandardTime = ProcessStandardRow
export type StandardTimeFormValues = Pick<
  ProcessStandardInsert,
  | 'customer'
  | 'job_name'
  | 'equipment_no'
  | 'operation'
  | 'model'
  | 'standard_seconds'
  | 'theoretical_seconds'
  | 'labor_rate'
  | 'equipment_rate'
  | 'tool_rate'
  | 'cutting_fluid_rate'
  | 'fixture_rate'
  | 'inspection_seconds'
  | 'daily_management_cost'
  | 'daily_total_hours'
  | 'uploaded_by_name'
  | 'remark'
>

function normalizeStandardTimeValue(value: string): string {
  return value.trim()
}

function normalizeStandardTimePayload(
  values: StandardTimeFormValues,
): StandardTimeFormValues {
  return {
    ...values,
    customer: values.customer?.trim() || null,
    job_name: values.job_name?.trim() || null,
    equipment_no: values.equipment_no?.trim() || null,
    operation: normalizeStandardTimeValue(values.operation),
    model: normalizeStandardTimeValue(values.model),
    theoretical_seconds: values.theoretical_seconds ?? 0,
    labor_rate: values.labor_rate ?? 0,
    equipment_rate: values.equipment_rate ?? 0,
    tool_rate: values.tool_rate ?? 0,
    cutting_fluid_rate: values.cutting_fluid_rate ?? 0,
    fixture_rate: values.fixture_rate ?? 0,
    inspection_seconds: values.inspection_seconds ?? 0,
    daily_management_cost: values.daily_management_cost ?? 0,
    daily_total_hours: values.daily_total_hours ?? 0,
    uploaded_by_name: values.uploaded_by_name?.trim() || null,
    remark: values.remark?.trim() || null,
  }
}

async function getJobHourlyFee(jobName: string): Promise<number | null> {
  // @ts-ignore - 新增 RPC 可能尚未出现在自动生成的 Supabase 类型中
  const { data, error } = await supabase.rpc('get_job_hourly_fee', {
    target_job_name: jobName,
  })

  if (error) {
    throw handleApiError(error, '获取岗位工时费失败')
  }

  if (data == null) {
    return null
  }

  const hourlyFee = Number(data)

  return Number.isFinite(hourlyFee) ? hourlyFee : null
}

async function applyDefaultLaborRate(
  values: StandardTimeFormValues,
): Promise<StandardTimeFormValues> {
  const normalizedValues = normalizeStandardTimePayload(values)

  if (normalizedValues.job_name && values.labor_rate == null) {
    const hourlyFee = await getJobHourlyFee(normalizedValues.job_name)

    if (hourlyFee !== null) {
      normalizedValues.labor_rate = hourlyFee
    }
  }

  return normalizedValues
}

async function applyMachineEquipmentDefaults(
  values: StandardTimeFormValues,
): Promise<StandardTimeFormValues> {
  const normalizedValues = await applyDefaultLaborRate(values)

  if (normalizedValues.equipment_no) {
    const equipmentHourlyRate = await getMachineEquipmentHourlyRate(
      normalizedValues.equipment_no,
    )

    if (values.equipment_rate == null && equipmentHourlyRate !== null) {
      normalizedValues.equipment_rate = equipmentHourlyRate
    }
  }

  return normalizedValues
}

export async function getStandardTimes({
  page,
  pageSize,
  operation,
  model,
  unmatchedOnly,
  updatedStartDate,
  updatedEndDate,
}: {
  page: number
  pageSize: number
  operation?: string
  model?: string
  unmatchedOnly?: boolean
  updatedStartDate?: string
  updatedEndDate?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const buildBaseQuery = () => {
    let query = supabase.from('process_standards').select('*', { count: 'exact' })

    if (operation) {
      query = query.ilike('operation', `%${operation}%`)
    }

    if (model) {
      query = query.ilike('model', `%${model}%`)
    }

    if (unmatchedOnly) {
      query = query.is('job_name', null)
    }

    if (updatedStartDate) {
      query = query.gte(
        'updated_at',
        dayjs(updatedStartDate).startOf('day').toISOString(),
      )
    }

    if (updatedEndDate) {
      query = query.lte(
        'updated_at',
        dayjs(updatedEndDate).endOf('day').toISOString(),
      )
    }

    return query
  }

  const buildCountQuery = () => {
    let query = supabase
      .from('process_standards')
      .select('id', { count: 'exact', head: true })

    if (operation) {
      query = query.ilike('operation', `%${operation}%`)
    }

    if (model) {
      query = query.ilike('model', `%${model}%`)
    }

    if (unmatchedOnly) {
      query = query.is('job_name', null)
    }

    if (updatedStartDate) {
      query = query.gte(
        'updated_at',
        dayjs(updatedStartDate).startOf('day').toISOString(),
      )
    }

    if (updatedEndDate) {
      query = query.lte(
        'updated_at',
        dayjs(updatedEndDate).endOf('day').toISOString(),
      )
    }

    return query
  }

  const [{ count: total, error: totalError }, { count: zeroCount, error: zeroCountError }] =
    await Promise.all([
      buildCountQuery(),
      buildCountQuery().eq('standard_seconds', 0),
    ])

  if (totalError || zeroCountError) {
    throw handleApiError(totalError || zeroCountError, '获取成本核算列表失败')
  }

  const normalizedZeroCount = zeroCount || 0
  const fetchTasks: Array<Promise<{ data: StandardTime[]; error: unknown }>> = []

  if (from < normalizedZeroCount) {
    fetchTasks.push(
      (async () => {
        const { data, error } = await buildBaseQuery()
          .eq('standard_seconds', 0)
          .order('operation', { ascending: true })
          .order('model', { ascending: true })
          .range(from, Math.min(to, normalizedZeroCount - 1))

        return {
          data: (data || []) as StandardTime[],
          error,
        }
      })(),
    )
  }

  if (to >= normalizedZeroCount) {
    const nonZeroFrom = Math.max(0, from - normalizedZeroCount)
    const nonZeroTo = to - normalizedZeroCount

    fetchTasks.push(
      (async () => {
        const { data, error } = await buildBaseQuery()
          .gt('standard_seconds', 0)
          .order('operation', { ascending: true })
          .order('model', { ascending: true })
          .range(nonZeroFrom, nonZeroTo)

        return {
          data: (data || []) as StandardTime[],
          error,
        }
      })(),
    )
  }

  const results = await Promise.all(fetchTasks)
  const failed = results.find((result) => result.error)

  if (failed?.error) {
    throw handleApiError(failed.error, '获取成本核算列表失败')
  }

  return {
    items: results.flatMap((result) => result.data || []),
    total: total || 0,
  }
}

async function checkStandardTimeExists(
  operation: string,
  model: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from('process_standards')
    .select('id')
    .eq('operation', operation)
    .eq('model', model)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查成本核算失败')
  }

  return (data?.length || 0) > 0
}

export async function createStandardTime(values: StandardTimeFormValues) {
  const normalizedValues = await applyMachineEquipmentDefaults(values)

  if (!normalizedValues.job_name) {
    throw new Error('工种不能为空')
  }

  if (!normalizedValues.customer) {
    throw new Error('客户不能为空')
  }

  if (normalizedValues.operation && normalizedValues.model) {
    const exists = await checkStandardTimeExists(
      normalizedValues.operation,
      normalizedValues.model,
    )
    if (exists) {
      throw new Error(
        `工序 "${normalizedValues.operation}" 和型号 "${normalizedValues.model}" 的成本核算已存在，无法创建`,
      )
    }
  }

  const { error } = await supabase
    .from('process_standards')
    .insert(normalizedValues)

  if (error) {
    throw handleApiError(error, '创建成本核算失败')
  }
}

export async function ensureStandardTimeExists({
  operation,
  model,
  standard_seconds = 0,
  theoretical_seconds = 0,
}: Pick<StandardTimeFormValues, 'operation' | 'model'> &
  Partial<Pick<StandardTimeFormValues, 'standard_seconds' | 'theoretical_seconds'>>) {
  const normalizedOperation = normalizeStandardTimeValue(operation)
  const normalizedModel = normalizeStandardTimeValue(model)

  if (!normalizedOperation || !normalizedModel) {
    throw new Error('工序和型号不能为空')
  }

  const exists = await checkStandardTimeExists(
    normalizedOperation,
    normalizedModel,
  )

  if (exists) {
    return false
  }

  const { error } = await supabase.from('process_standards').insert({
    operation: normalizedOperation,
    model: normalizedModel,
    standard_seconds,
    theoretical_seconds,
  })

  if (error) {
    if (error.code === '23505') {
      return false
    }

    throw handleApiError(error, '创建成本核算失败')
  }

  return true
}

export async function updateStandardTime({
  id,
  values,
}: {
  id: string
  values: StandardTimeFormValues
}) {
  const normalizedValues = await applyMachineEquipmentDefaults(values)

  if (normalizedValues.operation && normalizedValues.model) {
    const exists = await checkStandardTimeExists(
      normalizedValues.operation,
      normalizedValues.model,
      id,
    )
    if (exists) {
      throw new Error(
        `工序 "${normalizedValues.operation}" 和型号 "${normalizedValues.model}" 的成本核算已存在，无法更新`,
      )
    }
  }

  const { error } = await supabase
    .from('process_standards')
    .update(normalizedValues)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新成本核算失败')
  }
}

export async function deleteStandardTimes(ids: string[]) {
  const { error } = await supabase
    .from('process_standards')
    .delete()
    .in('id', ids)

  if (error) {
    if (error.code === '23503') {
      throw new Error('成本核算已被工序明细引用，不能删除')
    }

    throw handleApiError(error, '删除成本核算失败')
  }
}
