import supabase from './supabase'
import dayjs from 'dayjs'
import { handleApiError } from '@/utils/errorHandler'

export interface LaborProtectionRequisition {
  id: string
  labor_protection_data_id: string
  machine_equipment_id: string | null
  category: string
  machine_no: string
  machine_name: string
  job_title: string
  quantity: number
  recipient: string
  created_at: string
  updated_at: string
}

export interface LaborProtectionRequisitionFormValues {
  labor_protection_data_id: string
  machine_equipment_id: string
  job_title: string
  quantity: number
  recipient: string
}

type DynamicSupabaseTable = {
  from: (table: string) => any
}

type LaborProtectionRequisitionRow = {
  id: string
  labor_protection_data_id: string
  machine_equipment_id: string | null
  job_title: string
  quantity: number
  recipient: string
  created_at: string
  updated_at: string
  labor_protection_data?:
    | {
        id: string
        category: string
      }
    | Array<{
        id: string
        category: string
      }>
    | null
  machine_equipment_maintenances?:
    | {
        id: string
        unified_device_no: string
        machine_name: string
      }
    | Array<{
        id: string
        unified_device_no: string
        machine_name: string
      }>
    | null
}

const LABOR_PROTECTION_REQUISITION_SELECT = `
      id,
      labor_protection_data_id,
      machine_equipment_id,
      job_title,
      quantity,
      recipient,
      created_at,
      updated_at,
      labor_protection_data(id, category),
      machine_equipment_maintenances(id, unified_device_no, machine_name)
    `

function laborProtectionRequisitionTable() {
  return (supabase as unknown as DynamicSupabaseTable).from(
    'labor_protection_requisitions',
  )
}

function normalizeRequiredText(value: string, label: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`请输入${label}`)
  }

  return normalized
}

function normalizeQuantity(value: number | string | null | undefined) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('数量必须为大于 0 的整数')
  }

  return parsed
}

function normalizeFormValues(
  values: LaborProtectionRequisitionFormValues,
): LaborProtectionRequisitionFormValues {
  if (!values.labor_protection_data_id) {
    throw new Error('请选择劳保种类')
  }

  if (!values.machine_equipment_id) {
    throw new Error('请选择机器编号')
  }

  return {
    labor_protection_data_id: values.labor_protection_data_id,
    machine_equipment_id: values.machine_equipment_id,
    job_title: normalizeRequiredText(values.job_title, '岗位'),
    quantity: normalizeQuantity(values.quantity),
    recipient: normalizeRequiredText(values.recipient, '领取人'),
  }
}

function extractCategory(
  laborProtectionData: LaborProtectionRequisitionRow['labor_protection_data'],
) {
  if (!laborProtectionData) {
    return ''
  }

  if (Array.isArray(laborProtectionData)) {
    return laborProtectionData[0]?.category || ''
  }

  return laborProtectionData.category || ''
}

function extractMachineInfo(
  machineEquipment: LaborProtectionRequisitionRow['machine_equipment_maintenances'],
) {
  const value = Array.isArray(machineEquipment)
    ? machineEquipment[0]
    : machineEquipment

  return {
    machine_no: value?.unified_device_no || '',
    machine_name: value?.machine_name || '',
  }
}

function mapLaborProtectionRequisition(
  row: LaborProtectionRequisitionRow,
): LaborProtectionRequisition {
  const machineInfo = extractMachineInfo(row.machine_equipment_maintenances)

  return {
    id: row.id,
    labor_protection_data_id: row.labor_protection_data_id,
    machine_equipment_id: row.machine_equipment_id,
    category: extractCategory(row.labor_protection_data),
    ...machineInfo,
    job_title: row.job_title,
    quantity: Number(row.quantity || 0),
    recipient: row.recipient,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getLaborProtectionRequisitionList({
  page,
  pageSize,
  keyword,
  categoryId,
  updatedStartDate,
  updatedEndDate,
}: {
  page: number
  pageSize: number
  keyword?: string
  categoryId?: string
  updatedStartDate?: string
  updatedEndDate?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = laborProtectionRequisitionTable().select(
    LABOR_PROTECTION_REQUISITION_SELECT,
    { count: 'exact' },
  )

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `job_title.ilike.%${normalizedKeyword}%,recipient.ilike.%${normalizedKeyword}%`,
    )
  }

  if (categoryId) {
    query = query.eq('labor_protection_data_id', categoryId)
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

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw handleApiError(error, '获取劳保领料单列表失败')
  }

  return {
    items: ((data || []) as LaborProtectionRequisitionRow[]).map(
      mapLaborProtectionRequisition,
    ),
    total: count || 0,
  }
}

export async function getLaborProtectionRequisitionsForExport({
  keyword,
  categoryId,
  updatedStartDate,
  updatedEndDate,
}: {
  keyword?: string
  categoryId?: string
  updatedStartDate?: string
  updatedEndDate?: string
}) {
  let query = laborProtectionRequisitionTable().select(
    LABOR_PROTECTION_REQUISITION_SELECT,
  )

  if (keyword?.trim()) {
    const normalizedKeyword = keyword.trim()
    query = query.or(
      `job_title.ilike.%${normalizedKeyword}%,recipient.ilike.%${normalizedKeyword}%`,
    )
  }

  if (categoryId) {
    query = query.eq('labor_protection_data_id', categoryId)
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

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw handleApiError(error, '导出劳保领料单失败')
  }

  return ((data || []) as LaborProtectionRequisitionRow[]).map(
    mapLaborProtectionRequisition,
  )
}

export async function createLaborProtectionRequisition(
  values: LaborProtectionRequisitionFormValues,
) {
  const payload = normalizeFormValues(values)

  const { error } = await laborProtectionRequisitionTable().insert(payload)

  if (error) {
    throw handleApiError(error, '创建劳保领料单失败')
  }
}

export async function updateLaborProtectionRequisition({
  id,
  values,
}: {
  id: string
  values: LaborProtectionRequisitionFormValues
}) {
  const payload = normalizeFormValues(values)

  const { error } = await laborProtectionRequisitionTable()
    .update(payload)
    .eq('id', id)

  if (error) {
    throw handleApiError(error, '更新劳保领料单失败')
  }
}

export async function deleteLaborProtectionRequisition(ids: string[]) {
  const normalizedIds = ids.filter(Boolean)

  if (normalizedIds.length === 0) {
    throw new Error('请选择至少一条劳保领料单数据')
  }

  const { error } = await laborProtectionRequisitionTable()
    .delete()
    .in('id', normalizedIds)

  if (error) {
    throw handleApiError(error, '删除劳保领料单失败')
  }
}
