import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface MachineEquipmentMaintenance {
  id: string
  unified_device_no: string
  operation: string
  machine_name: string
  original_no: string | null
  power_kw: number
  sync_work_quantity: number
  electricity_unit_price: number
  hourly_electricity_fee: number
  machine_value: number
  depreciation_years: number
  annual_runtime_hours: number
  depreciation_rate: number
  equipment_hourly_rate: number
  remark: string | null
  created_at: string
  updated_at: string
}

export interface MachineEquipmentMaintenanceFormValues {
  unified_device_no: string
  operation: string
  machine_name: string
  original_no?: string
  power_kw: number
  sync_work_quantity: number
  electricity_unit_price: number
  machine_value: number
  depreciation_years: number
  annual_runtime_hours: number
  remark?: string
}

export interface MachineEquipmentMaintenanceOption {
  unified_device_no: string
  operation: string
  machine_name: string
  equipment_hourly_rate: number
}

type MachineEquipmentMaintenancesTable = {
  from: (table: string) => any
}

function machineEquipmentMaintenancesTable() {
  return (supabase as unknown as MachineEquipmentMaintenancesTable).from(
    'machine_equipment_maintenances',
  )
}

function normalizeOptionalText(value?: string) {
  const nextValue = value?.trim()
  return nextValue ? nextValue : null
}

function normalizePayload(
  values: MachineEquipmentMaintenanceFormValues,
): Record<string, string | number | null> {
  return {
    unified_device_no: values.unified_device_no.trim(),
    operation: values.operation.trim(),
    machine_name: values.machine_name.trim(),
    original_no: normalizeOptionalText(values.original_no),
    power_kw: Number(values.power_kw ?? 0),
    sync_work_quantity: Number(values.sync_work_quantity ?? 1),
    electricity_unit_price: Number(values.electricity_unit_price ?? 0),
    machine_value: Number(values.machine_value ?? 0),
    depreciation_years: Number(values.depreciation_years ?? 1),
    annual_runtime_hours: Number(values.annual_runtime_hours ?? 0),
    remark: normalizeOptionalText(values.remark),
  }
}

async function checkMachineEquipmentExists(
  unifiedDeviceNo: string,
  excludeId?: string,
) {
  let query = machineEquipmentMaintenancesTable()
    .select('id')
    .eq('unified_device_no', unifiedDeviceNo)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '检查机器设备维护数据失败')
  }

  return (data?.length || 0) > 0
}

export async function getMachineEquipmentMaintenances({
  page,
  pageSize,
  unifiedDeviceNo,
  operation,
  machineName,
}: {
  page: number
  pageSize: number
  unifiedDeviceNo?: string
  operation?: string
  machineName?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = machineEquipmentMaintenancesTable().select('*', {
    count: 'exact',
  })

  if (unifiedDeviceNo) {
    query = query.ilike('unified_device_no', `%${unifiedDeviceNo}%`)
  }

  if (operation) {
    query = query.ilike('operation', `%${operation}%`)
  }

  if (machineName) {
    query = query.ilike('machine_name', `%${machineName}%`)
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('unified_device_no', { ascending: true })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取机器设备维护列表失败')
  }

  return {
    items: (data || []) as MachineEquipmentMaintenance[],
    total: count || 0,
  }
}

export async function getMachineEquipmentMaintenanceOptions() {
  const { data, error } = await machineEquipmentMaintenancesTable()
    .select('unified_device_no, operation, machine_name, equipment_hourly_rate')
    .order('unified_device_no', { ascending: true })

  if (error) {
    throw handleApiError(error, '获取机器设备选项失败')
  }

  return (data || []) as MachineEquipmentMaintenanceOption[]
}

export async function getMachineEquipmentHourlyRate(
  unifiedDeviceNo: string,
): Promise<number | null> {
  const { data, error } = await machineEquipmentMaintenancesTable()
    .select('equipment_hourly_rate')
    .eq('unified_device_no', unifiedDeviceNo)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw handleApiError(error, '获取设备小时费率失败')
  }

  if (!data) {
    return null
  }

  const hourlyRate = Number(data.equipment_hourly_rate)

  return Number.isFinite(hourlyRate) ? hourlyRate : null
}

export async function createMachineEquipmentMaintenance(
  values: MachineEquipmentMaintenanceFormValues,
) {
  const payload = normalizePayload(values)

  const exists = await checkMachineEquipmentExists(
    String(payload.unified_device_no),
  )
  if (exists) {
    throw new Error(`统一设备编号“${payload.unified_device_no}”已存在，无法创建`)
  }

  const { error } = await machineEquipmentMaintenancesTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建机器设备维护失败')
  }
}

export async function updateMachineEquipmentMaintenance({
  id,
  values,
}: {
  id: string
  values: MachineEquipmentMaintenanceFormValues
}) {
  const payload = normalizePayload(values)

  const exists = await checkMachineEquipmentExists(
    String(payload.unified_device_no),
    id,
  )
  if (exists) {
    throw new Error(`统一设备编号“${payload.unified_device_no}”已存在，无法更新`)
  }

  const { error } = await machineEquipmentMaintenancesTable()
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新机器设备维护失败')
  }
}

export async function deleteMachineEquipmentMaintenances(ids: string[]) {
  const { error } = await machineEquipmentMaintenancesTable()
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除机器设备维护失败')
  }
}