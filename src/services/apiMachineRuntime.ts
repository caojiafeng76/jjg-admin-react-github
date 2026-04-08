import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

type SupabaseAny = {
  from: (table: string) => ReturnType<typeof supabase.from>
}

function viewFrom(viewName: string) {
  return (supabase as unknown as SupabaseAny).from(viewName)
}

export interface MachineRuntimeFilters {
  dateFrom?: string
  dateTo?: string
  unifiedDeviceNo?: string
  deviceOperation?: string
  machineName?: string
  machineEquipmentId?: string
  page?: number
  pageSize?: number
}

export interface MachineRuntimeItem {
  id: string
  order_id: string
  project_no: string
  product_model: string | null
  customer_model: string | null
  length_mm: number | null
  operation: string
  incoming_qualified_quantity: number
  theoretical_seconds: number
  machine_equipment_id: string | null
  runtime_seconds: number
  order_date: string | null
  employee_id: string | null
  operator_name: string | null
  unified_device_no: string | null
  device_operation: string | null
  machine_name: string | null
}

export interface MachineRuntimeSummaryItem {
  machine_equipment_id: string
  unified_device_no: string
  device_operation: string
  machine_name: string
  total_runtime_seconds: number
}

export async function getMachineRuntimeItems({
  dateFrom,
  dateTo,
  unifiedDeviceNo,
  deviceOperation,
  machineName,
  machineEquipmentId,
  page = 1,
  pageSize = 50,
}: MachineRuntimeFilters): Promise<{
  items: MachineRuntimeItem[]
  total: number
}> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 使用 VIEW v_machine_runtime_items 查询
  let query = viewFrom('v_machine_runtime_items')
    .select('*', { count: 'exact' })
    .not('machine_equipment_id', 'is', null)

  if (dateFrom) {
    query = query.gte('order_date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('order_date', dateTo)
  }
  if (unifiedDeviceNo) {
    query = query.ilike('unified_device_no', `%${unifiedDeviceNo}%`)
  }
  if (deviceOperation) {
    query = query.ilike('device_operation', `%${deviceOperation}%`)
  }
  if (machineName) {
    query = query.ilike('machine_name', `%${machineName}%`)
  }
  if (machineEquipmentId) {
    query = query.eq('machine_equipment_id', machineEquipmentId)
  }

  const { data, error, count } = await query
    .order('order_date', { ascending: false })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取设备运行明细失败')
  }

  return {
    items: (data || []) as MachineRuntimeItem[],
    total: count || 0,
  }
}

export async function getMachineRuntimeSummary(
  filters: Omit<MachineRuntimeFilters, 'page' | 'pageSize' | 'machineEquipmentId'>,
): Promise<MachineRuntimeSummaryItem[]> {
  // 先获取所有符合条件的明细，然后在前端汇总
  // Supabase 不直接支持 GROUP BY，通过获取全量数据后聚合
  let query = viewFrom('v_machine_runtime_items')
    .select(
      'machine_equipment_id, unified_device_no, device_operation, machine_name, runtime_seconds',
    )
    .not('machine_equipment_id', 'is', null)

  if (filters.dateFrom) {
    query = query.gte('order_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('order_date', filters.dateTo)
  }
  if (filters.unifiedDeviceNo) {
    query = query.ilike('unified_device_no', `%${filters.unifiedDeviceNo}%`)
  }
  if (filters.deviceOperation) {
    query = query.ilike('device_operation', `%${filters.deviceOperation}%`)
  }
  if (filters.machineName) {
    query = query.ilike('machine_name', `%${filters.machineName}%`)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取设备运行汇总失败')
  }

  // 前端 GROUP BY machine_equipment_id 汇总
  const summaryMap = new Map<string, MachineRuntimeSummaryItem>()

  for (const row of data || []) {
    const key = row.machine_equipment_id as string
    if (summaryMap.has(key)) {
      summaryMap.get(key)!.total_runtime_seconds += Number(row.runtime_seconds || 0)
    } else {
      summaryMap.set(key, {
        machine_equipment_id: key,
        unified_device_no: row.unified_device_no || '',
        device_operation: row.device_operation || '',
        machine_name: row.machine_name || '',
        total_runtime_seconds: Number(row.runtime_seconds || 0),
      })
    }
  }

  const result = Array.from(summaryMap.values()).sort(
    (a, b) => b.total_runtime_seconds - a.total_runtime_seconds,
  )

  return result
}
