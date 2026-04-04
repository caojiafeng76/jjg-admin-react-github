import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

type AttendanceDetailsTable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

function attendanceTable() {
  return (supabase as unknown as AttendanceDetailsTable).from(
    'attendance_details',
  )
}

export interface AttendanceDetail {
  id: string
  name: string
  date: string
  time: string
  created_at: string
  updated_at: string
}

export interface AttendanceDetailFormValues {
  name: string
  date: string
  time: string
}

function normalizePayload(
  values: AttendanceDetailFormValues,
): Record<string, string> {
  return {
    name: values.name.trim(),
    date: values.date,
    time: values.time,
  }
}

export async function getAttendanceDetails({
  page,
  pageSize,
  name,
  startDate,
  endDate,
}: {
  page: number
  pageSize: number
  name?: string
  startDate?: string
  endDate?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = attendanceTable().select('*', { count: 'exact' })

  if (name) {
    query = query.ilike('name', `%${name}%`)
  }

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取考勤明细列表失败')
  }

  return {
    items: (data || []) as AttendanceDetail[],
    total: count || 0,
  }
}

export async function createAttendanceDetail(
  values: AttendanceDetailFormValues,
) {
  const { data, error } = await attendanceTable()
    .insert(normalizePayload(values))
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '创建考勤明细失败')
  }

  return data as AttendanceDetail
}

export async function updateAttendanceDetail({
  id,
  ...values
}: AttendanceDetailFormValues & { id: string }) {
  const { data, error } = await attendanceTable()
    .update(normalizePayload(values))
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw handleApiError(error, '更新考勤明细失败')
  }

  return data as AttendanceDetail
}

export async function deleteAttendanceDetails(ids: string[]) {
  const { error } = await attendanceTable().delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除考勤明细失败')
  }
}

export async function createAttendanceDetailsBatch(
  rows: AttendanceDetailFormValues[],
) {
  const payload = rows.map(normalizePayload)
  const { error } = await attendanceTable().insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入考勤明细失败')
  }
}
