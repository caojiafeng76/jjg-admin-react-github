import dayjs from 'dayjs'

import type { WorkshopOrder } from '@/features/workshop/OrderList'
import { handleApiError } from '@/utils/errorHandler'
import {
  buildOrIlikeFilter,
  normalizeSearchKeywords,
} from '@/utils/searchKeywords'
import { getWorkshopOrders } from './apiWorkshopOrders'
import type { Database } from './database.types'
import supabase from './supabase'

const LOOKUP_PAGE_SIZE = 1000
const PROJECT_NO_BATCH_SIZE = 80
const UNMATCHED_JOB_NAME = '未匹配岗位'

type ProductionOrderItemRow = Pick<
  Database['public']['Tables']['production_order_items']['Row'],
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'data_category'
  | 'project_no'
  | 'product_model'
  | 'customer_model'
  | 'length_mm'
  | 'operation'
  | 'qualified_quantity'
  | 'qualified_hours'
  | 'incoming_qualified_quantity'
  | 'defect_quantity_1'
  | 'defect_quantity_2'
  | 'defect_reason_1'
  | 'defect_reason_2'
  | 'defect_hours'
  | 'outsource_defect_quantity'
  | 'outsource_defect_reason'
  | 'outsource_unit'
  | 'setup_defect_quantity'
  | 'setup_responsible'
  | 'standard_seconds'
  | 'theoretical_seconds'
  | 'remark'
  | 'order_id'
  | 'machine_equipment_id'
>

type ProductionOrderRelation = {
  id: string
  order_date: string
  shift: string
  work_hours: number
  employee: { name: string } | null
}

type MachineEquipmentRelation = {
  machine_name: string | null
  unified_device_no: string | null
}

type ProductionOrderItemDetailRow = ProductionOrderItemRow & {
  machine_equipment_maintenances: MachineEquipmentRelation | null
  production_orders: ProductionOrderRelation | ProductionOrderRelation[] | null
}

type ProcessStandardJobRow = Pick<
  Database['public']['Tables']['process_standards']['Row'],
  'job_name' | 'operation' | 'model' | 'length' | 'part_no' | 'record_type'
> & {
  is_last_process?: boolean | null
}

type MaterialTransferRow = Pick<
  Database['public']['Tables']['material_transfers']['Row'],
  | 'project_no'
  | 'target_workshop'
  | 'transfer_quantity'
  | 'operator_names'
  | 'recipient_name'
  | 'is_audited'
  | 'created_at'
>

type PrecisionCuttingTransferRow = Pick<
  Database['public']['Tables']['precision_cutting_transfers']['Row'],
  | 'id'
  | 'created_at'
  | 'defect_reason'
  | 'is_audited'
  | 'length_mm'
  | 'long_material_length_mm'
  | 'long_material_quantity'
  | 'operator_names'
  | 'outsource_defect_quantity'
  | 'outsource_defect_reason'
  | 'outsource_unit'
  | 'process_owner'
  | 'processing_defect_count'
  | 'project_no'
  | 'raw_material_defect_count'
  | 'recipient_name'
  | 'remark'
  | 'responsible_process'
  | 'target_workshop'
  | 'transfer_quantity'
>

interface PrecisionCuttingTransferSummary {
  transferQuantity: number
  transferDetails: OrderStatusPrecisionCuttingTransferDetail[]
}

export interface OrderStatusMaterialTransferDetail {
  createdAt: string
  isAudited: boolean
  operatorNames: string[]
  recipientName: string
  targetWorkshop: string
  transferQuantity: number
}

export interface OrderStatusPrecisionCuttingTransferDetail {
  createdAt: string
  defectReason: string | null
  id: string
  isAudited: boolean
  lengthMm: number | null
  longMaterialLengthMm: number
  longMaterialQuantity: number
  operatorNames: string[]
  outsourceDefectQuantity: number
  outsourceDefectReason: string | null
  outsourceUnit: string | null
  processOwner: string | null
  processingDefectCount: number
  rawMaterialDefectCount: number
  recipientName: string
  remark: string | null
  responsibleProcess: string | null
  targetWorkshop: string
  transferQuantity: number
}

export interface OrderStatusProductionDetail {
  id: string
  createdAt: string
  updatedAt: string
  dataCategory: string
  projectNo: string
  productModel: string | null
  customerModel: string | null
  lengthMm: number | null
  operation: string
  orderId: string
  orderDate: string
  shift: string
  operatorName: string | null
  workHours: number
  machineEquipmentId: string | null
  machineName: string | null
  unifiedDeviceNo: string | null
  jobName: string
  incomingQualifiedQuantity: number
  qualifiedQuantity: number
  qualifiedHours: number | null
  defectQuantity: number
  defectQuantity1: number
  defectQuantity2: number
  defectReason1: string | null
  defectReason2: string | null
  defectHours: number | null
  outsourceDefectQuantity: number
  outsourceDefectReason: string | null
  outsourceUnit: string | null
  setupDefectQuantity: number
  setupResponsible: string | null
  standardSeconds: number
  theoreticalSeconds: number
  remark: string | null
}

interface MaterialTransferSummary {
  transferQuantity: number
  warehouseTransferQuantity: number
  transferRecordCount: number
  transferWorkshops: string[]
  latestTransferWorkshop: string | null
  latestTransferAt: string | null
  latestTransferOperatorNames: string[]
  transferDetails: OrderStatusMaterialTransferDetail[]
}

export type OrderProductionStatus = '正常' | '预警' | '延期'

export interface OrderStatusJobColumn {
  key: string
  title: string
  operations: string[]
}

export interface OrderStatusDashboardItem extends WorkshopOrder {
  id: string
  jobOutputs: Record<string, number>
  productionDetails: OrderStatusProductionDetail[]
  totalIncomingQuantity: number
  totalQualifiedQuantity: number
  totalDefectQuantity: number
  precisionCuttingQuantity: number
  precisionCuttingDetails: OrderStatusPrecisionCuttingTransferDetail[]
  transferQuantity: number
  warehouseTransferQuantity: number
  transferRecordCount: number
  transferWorkshops: string[]
  latestTransferWorkshop: string | null
  latestTransferAt: string | null
  latestTransferOperatorNames: string[]
  transferDetails: OrderStatusMaterialTransferDetail[]
  finishedQuantity: number
  completionRate: number | null
  yieldRate: number | null
  productionStatus: OrderProductionStatus
}

export interface OrderStatusDashboardResult {
  items: OrderStatusDashboardItem[]
  total: number
  jobColumns: OrderStatusJobColumn[]
  productionItemCount: number
  materialTransferCount: number
}

export interface OrderStatusDashboardFilters {
  materialCode?: string
  model?: string
  orderDate?: string
  productionStatus?: OrderProductionStatus
  projectNo?: string
  status?: WorkshopOrder['status']
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() || null
}

function addUniqueText(target: string[], value: string | null | undefined) {
  const normalized = normalizeText(value)

  if (normalized && !target.includes(normalized)) {
    target.push(normalized)
  }
}

function buildProcessJobKey(
  model: string | null | undefined,
  operation: string | null | undefined,
  partNo?: string | null | undefined,
  length?: number | null | undefined,
) {
  const normalizedLength = Number(length || 0)

  return [
    normalizeText(model) ?? '',
    normalizeText(operation) ?? '',
    normalizeText(partNo) ?? '',
    Number.isFinite(normalizedLength) && normalizedLength > 0
      ? String(normalizedLength)
      : '',
  ].join('::')
}

function buildOperationMatchKey(value: string | null | undefined) {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  const compact = normalized.replace(/\s+/g, '')
  const withoutParenthetical = compact.replace(/[（(][^（）()]*[）)]/g, '')
  const withoutDirectionalSuffix = withoutParenthetical.replace(
    /(?:上下|左右|上|下|左|右)+$/g,
    '',
  )

  return withoutDirectionalSuffix || withoutParenthetical || compact
}

function setUniqueJobMapValue(
  map: Map<string, string>,
  ambiguousKeys: Set<string>,
  key: string,
  jobName: string,
) {
  if (ambiguousKeys.has(key)) {
    return
  }

  const current = map.get(key)

  if (!current) {
    map.set(key, jobName)
    return
  }

  if (current !== jobName) {
    map.delete(key)
    ambiguousKeys.add(key)
  }
}

type LastProcessStatus = boolean | null

function setLastProcessMapValue(
  map: Map<string, LastProcessStatus>,
  key: string,
  isLastProcess: boolean,
) {
  const current = map.get(key)

  if (current === undefined) {
    map.set(key, isLastProcess)
    return
  }

  if (current !== isLastProcess) {
    map.set(key, null)
  }
}

function resolveLastProcessStatus(
  statuses: Array<LastProcessStatus | undefined>,
) {
  for (const status of statuses) {
    if (status !== undefined) {
      return status === true
    }
  }

  return undefined
}

function chunkValues<TValue>(values: TValue[], size: number) {
  const chunks: TValue[][] = []

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }

  return chunks
}

async function getAllProcessStandardJobRows() {
  const rows: ProcessStandardJobRow[] = []
  let from = 0

  while (true) {
    const to = from + LOOKUP_PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('process_standards')
      .select('*')
      .order('job_name', { ascending: true })
      .order('model', { ascending: true })
      .order('operation', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取成本核算岗位信息失败')
    }

    const pageRows = (data || []) as unknown as ProcessStandardJobRow[]
    rows.push(...pageRows)

    if (pageRows.length < LOOKUP_PAGE_SIZE) {
      break
    }

    from += LOOKUP_PAGE_SIZE
  }

  return rows
}

async function getProductionItemsByProjectNos(
  projectNos: string[],
): Promise<ProductionOrderItemDetailRow[]> {
  const uniqueProjectNos = Array.from(
    new Set(projectNos.map((item) => item.trim())),
  ).filter(Boolean)

  if (uniqueProjectNos.length === 0) {
    return []
  }

  const rows: ProductionOrderItemDetailRow[] = []

  for (const batch of chunkValues(uniqueProjectNos, PROJECT_NO_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from('production_order_items')
      .select(
        `
        id,
        created_at,
        updated_at,
        data_category,
        project_no,
        product_model,
        customer_model,
        length_mm,
        operation,
        incoming_qualified_quantity,
        qualified_quantity,
        qualified_hours,
        defect_quantity_1,
        defect_quantity_2,
        defect_reason_1,
        defect_reason_2,
        defect_hours,
        outsource_defect_quantity,
        outsource_defect_reason,
        outsource_unit,
        setup_defect_quantity,
        setup_responsible,
        standard_seconds,
        theoretical_seconds,
        remark,
        order_id,
        machine_equipment_id,
        production_orders(
          id,
          order_date,
          shift,
          work_hours,
          employee:employees(name)
        ),
        machine_equipment_maintenances!machine_equipment_id(
          unified_device_no,
          machine_name
        )
      `,
      )
      .in('project_no', batch)
      .neq('data_category', 'B')
      .order('created_at', { ascending: true })

    if (error) {
      throw handleApiError(error, '获取订单生产工单产量失败')
    }

    rows.push(...((data || []) as unknown as ProductionOrderItemDetailRow[]))
  }

  return rows
}

async function getMaterialTransfersByProjectNos(projectNos: string[]) {
  const uniqueProjectNos = Array.from(
    new Set(projectNos.map((item) => item.trim())),
  ).filter(Boolean)

  if (uniqueProjectNos.length === 0) {
    return [] as MaterialTransferRow[]
  }

  const rows: MaterialTransferRow[] = []

  for (const batch of chunkValues(uniqueProjectNos, PROJECT_NO_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from('material_transfers')
      .select(
        'project_no, target_workshop, transfer_quantity, operator_names, recipient_name, is_audited, created_at',
      )
      .in('project_no', batch)
      .order('created_at', { ascending: false })

    if (error) {
      throw handleApiError(error, '获取物料转移单汇总失败')
    }

    rows.push(...((data || []) as MaterialTransferRow[]))
  }

  return rows
}

async function getPrecisionCuttingTransfersByProjectNos(projectNos: string[]) {
  const uniqueProjectNos = Array.from(
    new Set(projectNos.map((item) => item.trim())),
  ).filter(Boolean)

  if (uniqueProjectNos.length === 0) {
    return [] as PrecisionCuttingTransferRow[]
  }

  const rows: PrecisionCuttingTransferRow[] = []

  for (const batch of chunkValues(uniqueProjectNos, PROJECT_NO_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from('precision_cutting_transfers')
      .select(
        'id, created_at, defect_reason, is_audited, length_mm, long_material_length_mm, long_material_quantity, operator_names, outsource_defect_quantity, outsource_defect_reason, outsource_unit, process_owner, processing_defect_count, project_no, raw_material_defect_count, recipient_name, remark, responsible_process, target_workshop, transfer_quantity',
      )
      .in('project_no', batch)

    if (error) {
      throw handleApiError(error, '获取精切转移单汇总失败')
    }

    rows.push(...((data || []) as PrecisionCuttingTransferRow[]))
  }

  return rows
}

function buildPrecisionCuttingSummaryMap(rows: PrecisionCuttingTransferRow[]) {
  const summaryMap = new Map<string, PrecisionCuttingTransferSummary>()

  for (const row of rows) {
    const projectNo = normalizeText(row.project_no)

    if (!projectNo) {
      continue
    }

    const current = summaryMap.get(projectNo) ?? {
      transferDetails: [],
      transferQuantity: 0,
    }
    const transferQuantity = Number(row.transfer_quantity || 0)

    current.transferQuantity += transferQuantity
    current.transferDetails.push({
      createdAt: row.created_at,
      defectReason: row.defect_reason,
      id: row.id,
      isAudited: row.is_audited,
      lengthMm: row.length_mm,
      longMaterialLengthMm: Number(row.long_material_length_mm || 0),
      longMaterialQuantity: Number(row.long_material_quantity || 0),
      operatorNames: row.operator_names || [],
      outsourceDefectQuantity: Number(row.outsource_defect_quantity || 0),
      outsourceDefectReason: row.outsource_defect_reason,
      outsourceUnit: row.outsource_unit,
      processOwner: row.process_owner,
      processingDefectCount: Number(row.processing_defect_count || 0),
      rawMaterialDefectCount: Number(row.raw_material_defect_count || 0),
      recipientName: row.recipient_name,
      remark: row.remark,
      responsibleProcess: row.responsible_process,
      targetWorkshop: row.target_workshop,
      transferQuantity,
    })

    current.transferDetails.sort((left, right) =>
      dayjs(right.createdAt).diff(dayjs(left.createdAt)),
    )
    summaryMap.set(projectNo, current)
  }

  return summaryMap
}

function buildMaterialTransferSummaryMap(rows: MaterialTransferRow[]) {
  const summaryMap = new Map<string, MaterialTransferSummary>()

  for (const row of rows) {
    const projectNo = normalizeText(row.project_no)

    if (!projectNo) {
      continue
    }

    const targetWorkshop = normalizeText(row.target_workshop)
    const current = summaryMap.get(projectNo) ?? {
      transferQuantity: 0,
      warehouseTransferQuantity: 0,
      transferRecordCount: 0,
      transferWorkshops: [],
      latestTransferWorkshop: null,
      latestTransferAt: null,
      latestTransferOperatorNames: [],
      transferDetails: [],
    }
    const transferQuantity = Number(row.transfer_quantity || 0)

    current.transferQuantity += transferQuantity
    current.transferRecordCount += 1

    if (targetWorkshop) {
      if (!current.transferWorkshops.includes(targetWorkshop)) {
        current.transferWorkshops.push(targetWorkshop)
      }

      if (targetWorkshop === '仓库') {
        current.warehouseTransferQuantity += transferQuantity
      }
    }

    if (
      !current.latestTransferAt ||
      dayjs(row.created_at).isAfter(dayjs(current.latestTransferAt))
    ) {
      current.latestTransferAt = row.created_at
      current.latestTransferWorkshop = targetWorkshop
      current.latestTransferOperatorNames = row.operator_names || []
    }

    current.transferDetails.push({
      createdAt: row.created_at,
      isAudited: row.is_audited,
      operatorNames: row.operator_names || [],
      recipientName: row.recipient_name,
      targetWorkshop: row.target_workshop,
      transferQuantity,
    })

    current.transferDetails.sort((left, right) =>
      dayjs(right.createdAt).diff(dayjs(left.createdAt)),
    )

    summaryMap.set(projectNo, current)
  }

  return summaryMap
}

function getSingleRelation<TRelation>(
  relation: TRelation | TRelation[] | null | undefined,
) {
  return Array.isArray(relation) ? relation[0] || null : relation || null
}

function getDefectQuantity(row: ProductionOrderItemRow) {
  return (
    Number(row.defect_quantity_1 || 0) +
    Number(row.defect_quantity_2 || 0) +
    Number(row.outsource_defect_quantity || 0) +
    Number(row.setup_defect_quantity || 0)
  )
}

function buildProductionDetail(
  row: ProductionOrderItemDetailRow,
  jobName: string,
): OrderStatusProductionDetail {
  const productionOrder = getSingleRelation(row.production_orders)
  const machine = row.machine_equipment_maintenances

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dataCategory: row.data_category,
    projectNo: row.project_no,
    productModel: row.product_model,
    customerModel: row.customer_model,
    lengthMm: row.length_mm,
    operation: row.operation,
    orderId: row.order_id,
    orderDate: productionOrder?.order_date ?? '',
    shift: productionOrder?.shift ?? '',
    operatorName: productionOrder?.employee?.name ?? null,
    workHours: Number(productionOrder?.work_hours || 0),
    machineEquipmentId: row.machine_equipment_id,
    machineName: machine?.machine_name ?? null,
    unifiedDeviceNo: machine?.unified_device_no ?? null,
    jobName,
    incomingQualifiedQuantity: Number(row.incoming_qualified_quantity || 0),
    qualifiedQuantity: Number(row.qualified_quantity || 0),
    qualifiedHours: row.qualified_hours,
    defectQuantity: getDefectQuantity(row),
    defectQuantity1: Number(row.defect_quantity_1 || 0),
    defectQuantity2: Number(row.defect_quantity_2 || 0),
    defectReason1: row.defect_reason_1,
    defectReason2: row.defect_reason_2,
    defectHours: row.defect_hours,
    outsourceDefectQuantity: Number(row.outsource_defect_quantity || 0),
    outsourceDefectReason: row.outsource_defect_reason,
    outsourceUnit: row.outsource_unit,
    setupDefectQuantity: Number(row.setup_defect_quantity || 0),
    setupResponsible: row.setup_responsible,
    standardSeconds: Number(row.standard_seconds || 0),
    theoreticalSeconds: Number(row.theoretical_seconds || 0),
    remark: row.remark,
  }
}

function buildProcessJobIndex(processRows: ProcessStandardJobRow[]) {
  const jobNames: string[] = []
  const jobOperations = new Map<string, string[]>()
  const lastProcessJobNames: string[] = []
  const lastProcessJobOperations = new Map<string, string[]>()
  const exactMap = new Map<string, string>()
  const exactOperationMatchMap = new Map<string, string>()
  const modelOperationMap = new Map<string, string>()
  const modelOperationMatchMap = new Map<string, string>()
  const modelOperationTypeBMap = new Map<string, string>()
  const modelOperationTypeBMatchMap = new Map<string, string>()
  const operationMap = new Map<string, string>()
  const operationMatchMap = new Map<string, string>()
  const exactLastProcessMap = new Map<string, LastProcessStatus>()
  const exactOperationMatchLastProcessMap = new Map<string, LastProcessStatus>()
  const modelOperationLastProcessMap = new Map<string, LastProcessStatus>()
  const modelOperationMatchLastProcessMap = new Map<string, LastProcessStatus>()
  const modelOperationTypeBLastProcessMap = new Map<string, LastProcessStatus>()
  const modelOperationTypeBMatchLastProcessMap = new Map<
    string,
    LastProcessStatus
  >()
  const operationLastProcessMap = new Map<string, LastProcessStatus>()
  const operationMatchLastProcessMap = new Map<string, LastProcessStatus>()
  const ambiguousExactKeys = new Set<string>()
  const ambiguousExactOperationMatchKeys = new Set<string>()
  const ambiguousModelOperationKeys = new Set<string>()
  const ambiguousModelOperationMatchKeys = new Set<string>()
  const ambiguousModelOperationTypeBKeys = new Set<string>()
  const ambiguousModelOperationTypeBMatchKeys = new Set<string>()
  const ambiguousOperationKeys = new Set<string>()
  const ambiguousOperationMatchKeys = new Set<string>()

  for (const row of processRows) {
    const jobName = normalizeText(row.job_name)
    const operation = normalizeText(row.operation)

    if (!jobName || !operation) {
      continue
    }

    addUniqueText(jobNames, jobName)

    const operations = jobOperations.get(jobName) ?? []
    addUniqueText(operations, operation)
    jobOperations.set(jobName, operations)

    if (row.is_last_process) {
      addUniqueText(lastProcessJobNames, jobName)

      const lastOperations = lastProcessJobOperations.get(jobName) ?? []
      addUniqueText(lastOperations, operation)
      lastProcessJobOperations.set(jobName, lastOperations)
    }

    const modelOperationKey = buildProcessJobKey(row.model, operation)
    const operationMatchKey = buildOperationMatchKey(operation)
    const modelOperationMatchKey = operationMatchKey
      ? buildProcessJobKey(row.model, operationMatchKey)
      : null

    setUniqueJobMapValue(
      modelOperationMap,
      ambiguousModelOperationKeys,
      modelOperationKey,
      jobName,
    )
    setLastProcessMapValue(
      modelOperationLastProcessMap,
      modelOperationKey,
      Boolean(row.is_last_process),
    )

    if (modelOperationMatchKey) {
      setUniqueJobMapValue(
        modelOperationMatchMap,
        ambiguousModelOperationMatchKeys,
        modelOperationMatchKey,
        jobName,
      )
      setLastProcessMapValue(
        modelOperationMatchLastProcessMap,
        modelOperationMatchKey,
        Boolean(row.is_last_process),
      )
    }

    if (row.record_type === 'B') {
      setUniqueJobMapValue(
        modelOperationTypeBMap,
        ambiguousModelOperationTypeBKeys,
        modelOperationKey,
        jobName,
      )
      setLastProcessMapValue(
        modelOperationTypeBLastProcessMap,
        modelOperationKey,
        Boolean(row.is_last_process),
      )
    }

    if (row.record_type === 'B' && modelOperationMatchKey) {
      setUniqueJobMapValue(
        modelOperationTypeBMatchMap,
        ambiguousModelOperationTypeBMatchKeys,
        modelOperationMatchKey,
        jobName,
      )
      setLastProcessMapValue(
        modelOperationTypeBMatchLastProcessMap,
        modelOperationMatchKey,
        Boolean(row.is_last_process),
      )
    }

    const exactKey = buildProcessJobKey(
      row.model,
      operation,
      row.part_no,
      row.length,
    )

    if (row.record_type === 'A') {
      setUniqueJobMapValue(exactMap, ambiguousExactKeys, exactKey, jobName)
      setLastProcessMapValue(
        exactLastProcessMap,
        exactKey,
        Boolean(row.is_last_process),
      )
    }

    if (row.record_type === 'A' && operationMatchKey) {
      const exactOperationMatchKey = buildProcessJobKey(
        row.model,
        operationMatchKey,
        row.part_no,
        row.length,
      )

      setUniqueJobMapValue(
        exactOperationMatchMap,
        ambiguousExactOperationMatchKeys,
        exactOperationMatchKey,
        jobName,
      )
      setLastProcessMapValue(
        exactOperationMatchLastProcessMap,
        exactOperationMatchKey,
        Boolean(row.is_last_process),
      )
    }

    setUniqueJobMapValue(
      operationMap,
      ambiguousOperationKeys,
      operation,
      jobName,
    )
    setLastProcessMapValue(
      operationLastProcessMap,
      operation,
      Boolean(row.is_last_process),
    )

    if (operationMatchKey) {
      setUniqueJobMapValue(
        operationMatchMap,
        ambiguousOperationMatchKeys,
        operationMatchKey,
        jobName,
      )
      setLastProcessMapValue(
        operationMatchLastProcessMap,
        operationMatchKey,
        Boolean(row.is_last_process),
      )
    }
  }

  return {
    exactMap,
    exactLastProcessMap,
    exactOperationMatchMap,
    exactOperationMatchLastProcessMap,
    jobNames,
    jobOperations,
    lastProcessJobNames,
    lastProcessJobOperations,
    modelOperationLastProcessMap,
    modelOperationMap,
    modelOperationMatchLastProcessMap,
    modelOperationMatchMap,
    modelOperationTypeBLastProcessMap,
    modelOperationTypeBMap,
    modelOperationTypeBMatchLastProcessMap,
    modelOperationTypeBMatchMap,
    operationLastProcessMap,
    operationMap,
    operationMatchLastProcessMap,
    operationMatchMap,
  }
}

function resolveProductionJobName({
  order,
  processJobIndex,
  row,
}: {
  order: WorkshopOrder | null
  processJobIndex: ReturnType<typeof buildProcessJobIndex>
  row: ProductionOrderItemRow
}) {
  const operation = normalizeText(row.operation)
  const model = normalizeText(row.product_model)
  const operationMatchKey = buildOperationMatchKey(operation)

  if (!operation) {
    return UNMATCHED_JOB_NAME
  }

  const operationOnlyJobName =
    processJobIndex.operationMap.get(operation) ||
    processJobIndex.operationMatchMap.get(operationMatchKey || '') ||
    UNMATCHED_JOB_NAME

  if (!model) {
    return operationOnlyJobName
  }

  const exactKey = buildProcessJobKey(
    model,
    operation,
    order?.material_code,
    order?.length_mm ?? row.length_mm,
  )
  const modelOperationKey = buildProcessJobKey(model, operation)
  const exactOperationMatchKey = buildProcessJobKey(
    model,
    operationMatchKey,
    order?.material_code,
    order?.length_mm ?? row.length_mm,
  )
  const modelOperationMatchKey = buildProcessJobKey(model, operationMatchKey)

  return (
    processJobIndex.exactMap.get(exactKey) ||
    processJobIndex.exactOperationMatchMap.get(exactOperationMatchKey) ||
    processJobIndex.modelOperationTypeBMap.get(modelOperationKey) ||
    processJobIndex.modelOperationTypeBMatchMap.get(modelOperationMatchKey) ||
    processJobIndex.modelOperationMap.get(modelOperationKey) ||
    processJobIndex.modelOperationMatchMap.get(modelOperationMatchKey) ||
    operationOnlyJobName
  )
}

function isLastProcessProductionRow({
  order,
  processJobIndex,
  row,
}: {
  order: WorkshopOrder | null
  processJobIndex: ReturnType<typeof buildProcessJobIndex>
  row: ProductionOrderItemRow
}) {
  const operation = normalizeText(row.operation)
  const model = normalizeText(row.product_model)
  const operationMatchKey = buildOperationMatchKey(operation)

  if (!operation) {
    return false
  }

  const operationOnlyStatus = resolveLastProcessStatus([
    processJobIndex.operationLastProcessMap.get(operation),
    operationMatchKey
      ? processJobIndex.operationMatchLastProcessMap.get(operationMatchKey)
      : undefined,
  ])

  if (!model) {
    return operationOnlyStatus ?? false
  }

  const exactKey = buildProcessJobKey(
    model,
    operation,
    order?.material_code,
    order?.length_mm ?? row.length_mm,
  )
  const modelOperationKey = buildProcessJobKey(model, operation)
  const exactOperationMatchKey = buildProcessJobKey(
    model,
    operationMatchKey,
    order?.material_code,
    order?.length_mm ?? row.length_mm,
  )
  const modelOperationMatchKey = buildProcessJobKey(model, operationMatchKey)

  return (
    resolveLastProcessStatus([
      processJobIndex.exactLastProcessMap.get(exactKey),
      processJobIndex.exactOperationMatchLastProcessMap.get(
        exactOperationMatchKey,
      ),
      processJobIndex.modelOperationTypeBLastProcessMap.get(modelOperationKey),
      processJobIndex.modelOperationTypeBMatchLastProcessMap.get(
        modelOperationMatchKey,
      ),
      processJobIndex.modelOperationLastProcessMap.get(modelOperationKey),
      processJobIndex.modelOperationMatchLastProcessMap.get(
        modelOperationMatchKey,
      ),
      operationOnlyStatus,
    ]) ?? false
  )
}

function buildJobColumns({
  lastProcessJobNames,
  lastProcessJobOperations,
}: Pick<
  ReturnType<typeof buildProcessJobIndex>,
  'lastProcessJobNames' | 'lastProcessJobOperations'
>) {
  return lastProcessJobNames.map((jobName) => ({
    key: jobName,
    title: jobName,
    operations: lastProcessJobOperations.get(jobName) ?? [],
  }))
}

function getProductionStatus({
  order,
  completionRate,
}: {
  order: WorkshopOrder
  completionRate: number | null
}): OrderProductionStatus {
  const status = normalizeText(order.status)

  if (
    status === '已结案' ||
    (completionRate !== null && completionRate >= 100)
  ) {
    return '正常'
  }

  const deliveryDate = normalizeText(order.product_delivery_date)

  if (deliveryDate) {
    const remainingDays = dayjs(deliveryDate).diff(
      dayjs().startOf('day'),
      'day',
    )

    if (remainingDays < 0) {
      return '延期'
    }

    if (remainingDays <= 7 && (completionRate ?? 0) < 100) {
      return '预警'
    }
  }

  if (completionRate !== null && completionRate > 0 && completionRate < 50) {
    return '预警'
  }

  return '正常'
}

async function getAllDashboardWorkshopOrders(
  filters?: OrderStatusDashboardFilters,
) {
  const rows: WorkshopOrder[] = []
  let from = 0

  while (true) {
    const to = from + LOOKUP_PAGE_SIZE - 1
    let query = supabase.from('sales_orders').select('*')
    const projectNo = normalizeText(filters?.projectNo)
    const modelKeywords = normalizeSearchKeywords(filters?.model)
    const orderDate = normalizeText(filters?.orderDate)
    const materialCode = normalizeText(filters?.materialCode)

    if (projectNo) {
      query = query.ilike('project_no', `%${projectNo}%`)
    }

    if (modelKeywords?.length) {
      query = query.or(
        buildOrIlikeFilter(['product_model', 'customer_model'], modelKeywords),
      )
    }

    if (orderDate) {
      query = query.ilike('product_delivery_date', `%${orderDate}%`)
    }

    if (materialCode) {
      query = query.ilike('material_code', `%${materialCode}%`)
    }

    if (filters?.status) {
      query = query.filter('status', 'eq', filters.status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('project_no', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取订单现状候选订单失败')
    }

    const pageRows = (data || []) as WorkshopOrder[]
    rows.push(...pageRows.map((item) => ({ ...item })))

    if (pageRows.length < LOOKUP_PAGE_SIZE) {
      break
    }

    from += LOOKUP_PAGE_SIZE
  }

  return rows
}

export async function getOrderStatusDashboard({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
}): Promise<OrderStatusDashboardResult> {
  const productionStatusFilter = filters?.productionStatus
  const [orderResult, processRows] = await Promise.all([
    productionStatusFilter
      ? getAllDashboardWorkshopOrders(filters).then((items) => ({
          items,
          total: items.length,
        }))
      : getWorkshopOrders({
          page,
          pageSize,
          product_delivery_date_search: filters?.orderDate,
          project_no: filters?.projectNo,
          material_code: filters?.materialCode,
          model_search: filters?.model ? [filters.model] : undefined,
          status: filters?.status,
        }),
    getAllProcessStandardJobRows(),
  ])
  const { items: orders, total } = orderResult

  const projectNos = orders
    .map((order) => normalizeText(order.project_no))
    .filter((projectNo): projectNo is string => Boolean(projectNo))
  const [productionRows, materialTransferRows, precisionCuttingTransferRows] =
    await Promise.all([
      getProductionItemsByProjectNos(projectNos),
      getMaterialTransfersByProjectNos(projectNos),
      getPrecisionCuttingTransfersByProjectNos(projectNos),
    ])
  const processJobIndex = buildProcessJobIndex(processRows)
  const jobColumns = buildJobColumns(processJobIndex)
  const materialTransferSummaryMap =
    buildMaterialTransferSummaryMap(materialTransferRows)
  const precisionCuttingSummaryMap = buildPrecisionCuttingSummaryMap(
    precisionCuttingTransferRows,
  )
  const productionByProjectNo = new Map<
    string,
    ProductionOrderItemDetailRow[]
  >()

  for (const row of productionRows) {
    const projectNo = normalizeText(row.project_no)

    if (!projectNo) {
      continue
    }

    const current = productionByProjectNo.get(projectNo) || []
    current.push(row)
    productionByProjectNo.set(projectNo, current)
  }

  const items = orders.map<OrderStatusDashboardItem>((order) => {
    const projectNo = normalizeText(order.project_no)
    const relatedRows = projectNo
      ? productionByProjectNo.get(projectNo) || []
      : []
    const transferSummary = projectNo
      ? materialTransferSummaryMap.get(projectNo)
      : null
    const precisionCuttingSummary = projectNo
      ? precisionCuttingSummaryMap.get(projectNo)
      : null
    const jobOutputs = Object.fromEntries(
      jobColumns.map((column) => [column.key, 0]),
    ) as Record<string, number>
    const productionDetails: OrderStatusProductionDetail[] = []
    let totalIncomingQuantity = 0
    let totalQualifiedQuantity = 0
    let totalDefectQuantity = 0

    for (const row of relatedRows) {
      const operation = normalizeText(row.operation)
      const jobName = resolveProductionJobName({
        order,
        processJobIndex,
        row,
      })
      const qualifiedQuantity = Number(row.qualified_quantity || 0)
      const defectQuantity = getDefectQuantity(row)

      totalIncomingQuantity += Number(row.incoming_qualified_quantity || 0)
      totalQualifiedQuantity += qualifiedQuantity
      totalDefectQuantity += defectQuantity

      if (operation) {
        if (
          isLastProcessProductionRow({
            order,
            processJobIndex,
            row,
          }) &&
          Object.prototype.hasOwnProperty.call(jobOutputs, jobName)
        ) {
          jobOutputs[jobName] = (jobOutputs[jobName] || 0) + qualifiedQuantity
        }

        productionDetails.push(buildProductionDetail(row, jobName))
      }
    }

    productionDetails.sort((left, right) => {
      const leftDate = left.orderDate || left.createdAt
      const rightDate = right.orderDate || right.createdAt

      return rightDate.localeCompare(leftDate)
    })

    const orderQuantity = Number(order.order_quantity || 0)
    const maxJobOutput = Math.max(0, ...Object.values(jobOutputs))
    const finishedQuantity =
      transferSummary?.transferQuantity ??
      Number(order.total_outbound_quantity || 0)
    const progressQuantity =
      finishedQuantity > 0 ? finishedQuantity : maxJobOutput
    const completionRate =
      orderQuantity > 0
        ? Number(
            Math.min((progressQuantity / orderQuantity) * 100, 100).toFixed(1),
          )
        : null
    const yieldBase = totalQualifiedQuantity + totalDefectQuantity
    const yieldRate =
      yieldBase > 0
        ? Number(((totalQualifiedQuantity / yieldBase) * 100).toFixed(1))
        : null

    return {
      ...order,
      id: order.id || projectNo || crypto.randomUUID(),
      jobOutputs,
      productionDetails,
      totalIncomingQuantity,
      totalQualifiedQuantity,
      totalDefectQuantity,
      precisionCuttingQuantity: precisionCuttingSummary?.transferQuantity ?? 0,
      precisionCuttingDetails: precisionCuttingSummary?.transferDetails ?? [],
      transferQuantity: transferSummary?.transferQuantity ?? 0,
      warehouseTransferQuantity:
        transferSummary?.warehouseTransferQuantity ?? 0,
      transferRecordCount: transferSummary?.transferRecordCount ?? 0,
      transferWorkshops: transferSummary?.transferWorkshops ?? [],
      latestTransferWorkshop: transferSummary?.latestTransferWorkshop ?? null,
      latestTransferAt: transferSummary?.latestTransferAt ?? null,
      latestTransferOperatorNames:
        transferSummary?.latestTransferOperatorNames ?? [],
      transferDetails: transferSummary?.transferDetails ?? [],
      finishedQuantity,
      completionRate,
      yieldRate,
      productionStatus: getProductionStatus({ order, completionRate }),
    }
  })

  const filteredItems = productionStatusFilter
    ? items.filter((item) => item.productionStatus === productionStatusFilter)
    : items
  const resultItems = productionStatusFilter
    ? filteredItems.slice((page - 1) * pageSize, page * pageSize)
    : filteredItems
  const productionItemCount = productionStatusFilter
    ? resultItems.reduce(
        (count, item) => count + item.productionDetails.length,
        0,
      )
    : productionRows.length
  const materialTransferCount = productionStatusFilter
    ? resultItems.reduce(
        (count, item) => count + item.transferDetails.length,
        0,
      )
    : materialTransferRows.length

  return {
    items: resultItems,
    total: productionStatusFilter ? filteredItems.length : total,
    jobColumns,
    productionItemCount,
    materialTransferCount,
  }
}
