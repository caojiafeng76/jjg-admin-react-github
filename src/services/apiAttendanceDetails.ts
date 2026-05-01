import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

type AttendanceDetailsTable = {
  from: (table: string) => any
  rpc: (fn: string, params?: Record<string, unknown>) => any
}

function attendanceTable() {
  return (supabase as unknown as AttendanceDetailsTable).from(
    'attendance_details',
  )
}

function attendanceViewTable() {
  return (supabase as unknown as AttendanceDetailsTable).from(
    'attendance_details_with_shift',
  )
}

export interface AttendanceDetail {
  id: string
  name: string
  date: string
  time: string
  created_at: string
  updated_at: string
  shift: string
}

export interface AttendanceShiftStat {
  name: string
  total_days: number
  day_shift_days: number
  night_shift_days: number
}

export interface AttendanceLateEarlyStat {
  name: string
  late_count: number
  late_dates: string[]
  early_leave_count: number
  early_leave_dates: string[]
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

function formatMonthDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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

  let query = attendanceViewTable().select('*', { count: 'exact' })

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

export async function getAttendanceShiftStats({
  startDate,
  endDate,
  name,
}: {
  startDate?: string
  endDate?: string
  name?: string
}) {
  const db = supabase as unknown as AttendanceDetailsTable
  const { data, error } = await db.rpc('get_attendance_shift_stats', {
    p_start_date: startDate || null,
    p_end_date: endDate || null,
    p_name: name || null,
  })

  if (error) {
    throw handleApiError(error, '获取考勤统计失败')
  }

  return (data || []) as AttendanceShiftStat[]
}

export async function getAttendanceLateEarlyStats({
  startDate,
  endDate,
  name,
}: {
  startDate?: string
  endDate?: string
  name?: string
}) {
  const db = supabase as unknown as AttendanceDetailsTable
  const { data, error } = await db.rpc('get_attendance_late_early_stats', {
    p_start_date: startDate || null,
    p_end_date: endDate || null,
    p_name: name || null,
  })

  if (error) {
    throw handleApiError(error, '获取迟到早退统计失败')
  }

  return (data || []) as AttendanceLateEarlyStat[]
}

export interface AttendanceMonthlyRow {
  employee_name: string
  job_name: string
  order_date: string
  work_hours: number
  shift: string
  remark?: string | null
}

export async function getAttendanceMonthlyExportData({
  year,
  month,
  name,
}: {
  year: number
  month: number
  name?: string
}) {
  const startDate = formatMonthDate(year, month, 1)
  const endDate = formatMonthDate(
    year,
    month,
    new Date(year, month, 0).getDate(),
  )
  const normalizedName = name?.trim()

  if (normalizedName) {
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .ilike('name', `%${normalizedName}%`)

    if (employeeError) {
      throw handleApiError(employeeError, '获取月度出勤数据失败')
    }

    const employeeIds = (employees || []).map((employee) => employee.id)

    if (!employeeIds.length) {
      return [] as AttendanceMonthlyRow[]
    }

    const { data, error } = await supabase
      .from('production_orders')
      .select(
        'order_date, work_hours, shift, remark, employee:employees!inner(name, job_name)',
      )
      .in('employee_id', employeeIds)
      .gte('order_date', startDate)
      .lte('order_date', endDate)
      .order('order_date', { ascending: true })

    if (error) {
      throw handleApiError(error, '获取月度出勤数据失败')
    }

    return (
      (data || []) as Array<{
        order_date: string
        work_hours: number
        shift: string
        remark?: string | null
        employee?: { name?: string | null; job_name?: string | null } | null
      }>
    )
      .filter((row) => Boolean(row.employee?.name))
      .sort(
        (left, right) =>
          String(left.employee?.name || '').localeCompare(
            String(right.employee?.name || ''),
            'zh-CN',
          ) || left.order_date.localeCompare(right.order_date),
      )
      .map((row) => ({
        employee_name: row.employee?.name || '',
        job_name: row.employee?.job_name || '',
        order_date: row.order_date,
        work_hours: Number(row.work_hours || 0),
        shift: row.shift,
        remark: row.remark,
      }))
  }

  const { data, error } = await supabase
    .from('production_orders')
    .select(
      'order_date, work_hours, shift, remark, employee:employees!inner(name, job_name)',
    )
    .gte('order_date', startDate)
    .lte('order_date', endDate)
    .order('order_date', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取月度出勤数据失败')
  }

  return (
    (data || []) as Array<{
      order_date: string
      work_hours: number
      shift: string
      remark?: string | null
      employee?: { name?: string | null; job_name?: string | null } | null
    }>
  )
    .filter((row) => Boolean(row.employee?.name))
    .sort(
      (left, right) =>
        String(left.employee?.name || '').localeCompare(
          String(right.employee?.name || ''),
          'zh-CN',
        ) || left.order_date.localeCompare(right.order_date),
    )
    .map((row) => ({
      employee_name: row.employee?.name || '',
      job_name: row.employee?.job_name || '',
      order_date: row.order_date,
      work_hours: Number(row.work_hours || 0),
      shift: row.shift,
      remark: row.remark,
    }))
}
