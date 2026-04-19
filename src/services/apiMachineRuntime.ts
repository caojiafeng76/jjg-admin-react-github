import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

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
  let query = supabase
    .from('v_machine_runtime_items')
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
  filters: Omit<
    MachineRuntimeFilters,
    'page' | 'pageSize' | 'machineEquipmentId'
  >,
): Promise<MachineRuntimeSummaryItem[]> {
  // 1. 获取全部设备（支持按设备编号/工序/机器名称筛选）
  let machineQuery = supabase
    .from('machine_equipment_maintenances')
    .select('id, unified_device_no, operation, machine_name')
    .order('unified_device_no')

  if (filters.unifiedDeviceNo) {
    machineQuery = machineQuery.ilike(
      'unified_device_no',
      `%${filters.unifiedDeviceNo}%`,
    )
  }
  if (filters.deviceOperation) {
    machineQuery = machineQuery.ilike(
      'operation',
      `%${filters.deviceOperation}%`,
    )
  }
  if (filters.machineName) {
    machineQuery = machineQuery.ilike(
      'machine_name',
      `%${filters.machineName}%`,
    )
  }

  const { data: allMachines, error: machineError } = await machineQuery

  if (machineError) {
    throw handleApiError(machineError, '获取设备列表失败')
  }

  // 2. 获取符合日期/筛选条件的运行明细，汇总 runtime_seconds
  let query = supabase
    .from('v_machine_runtime_items')
    .select('machine_equipment_id, runtime_seconds')
    .not('machine_equipment_id', 'is', null)

  if (filters.dateFrom) {
    query = query.gte('order_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('order_date', filters.dateTo)
  }

  const { data: runtimeRows, error: runtimeError } = await query

  if (runtimeError) {
    throw handleApiError(runtimeError, '获取设备运行汇总失败')
  }

  // 3. 按 machine_equipment_id 汇总运行秒数
  const runtimeMap = new Map<string, number>()
  for (const row of runtimeRows || []) {
    const key = row.machine_equipment_id as string
    runtimeMap.set(
      key,
      (runtimeMap.get(key) ?? 0) + Number(row.runtime_seconds || 0),
    )
  }

  // 4. 合并：全部设备 LEFT JOIN 运行数据
  const result: MachineRuntimeSummaryItem[] = (allMachines || []).map((m) => ({
    machine_equipment_id: m.id,
    unified_device_no: m.unified_device_no || '',
    device_operation: m.operation || '',
    machine_name: m.machine_name || '',
    total_runtime_seconds: runtimeMap.get(m.id) ?? 0,
  }))

  // 按运行时间降序排列
  result.sort((a, b) => b.total_runtime_seconds - a.total_runtime_seconds)

  return result
}
