import type { WorkshopOrder } from '@/features/workshop/OrderList'
import { handleApiError } from '@/utils/errorHandler'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import type { Database } from './database.types'
import supabase from './supabase'

const LOOKUP_PAGE_SIZE = 1000
const UNMATCHED_JOB_NAME = '未匹配岗位'
const PROCESS_STANDARD_JOB_SELECT =
  'job_name, operation, model, length, part_no, record_type, is_last_process'

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

type OrderStatusDashboardRpcItem = WorkshopOrder & {
  id: string
  completionRate: number | null
  finishedQuantity: number
  latestTransferAt: string | null
  latestTransferOperatorNames: string[] | string | null
  latestTransferWorkshop: string | null
  precisionCuttingDetails: OrderStatusPrecisionCuttingTransferDetail[] | null
  precisionCuttingQuantity: number
  extrusionDetails: OrderStatusExtrusionDetail[] | null
  extrusionQuantity: number
  productionRows: ProductionOrderItemDetailRow[] | null
  productionStatus: OrderProductionStatus
  totalDefectQuantity: number
  totalIncomingQuantity: number
  totalQualifiedQuantity: number
  transferDetails: OrderStatusMaterialTransferDetail[] | null
  transferQuantity: number
  transferRecordCount: number
  transferWorkshops: string[] | null
  warehouseTransferQuantity: number
  yieldRate: number | null
  reworkRepairRows: {
    workflow_status: string
    quantity: number
  }[] | null
}

interface OrderStatusDashboardRpcResult {
  items?: OrderStatusDashboardRpcItem[]
  materialTransferCount?: number
  productionItemCount?: number
  total?: number
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

export interface OrderStatusExtrusionDetail {
  createdAt: string
  productionDate: string
  shift: string
  shiftLeaderName: string
  isAudited: boolean
  actualOutputLengthMm: number | null
  orderLengthMm: number | null
  actualQuantity: number
  theoreticalOutputCount: number
  actualOutputWeightKg: number
  materialYield: number
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

export type OrderProductionStatus = '正常' | '预警' | '延期'

export interface ReworkRepairInfo {
  totalQuantity: number
  pendingWorkshopCount: number
  pendingProductionCount: number
  pendingTechnicalCount: number
  pendingQualityCount: number
  completedCount: number
}

export const REWORK_REPAIR_STATUS_COLORS: Record<
  keyof Omit<ReworkRepairInfo, 'totalQuantity'>,
  string
> = {
  pendingWorkshopCount: 'default',
  pendingProductionCount: 'processing',
  pendingTechnicalCount: 'warning',
  pendingQualityCount: 'orange',
  completedCount: 'success',
}

export const REWORK_REPAIR_STATUS_LABELS: Record<
  keyof Omit<ReworkRepairInfo, 'totalQuantity'>,
  string
> = {
  pendingWorkshopCount: '待车间发起',
  pendingProductionCount: '待生产部确认',
  pendingTechnicalCount: '待技术部确认',
  pendingQualityCount: '待质量部确认',
  completedCount: '已完成',
}

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
  extrusionQuantity: number
  extrusionDetails: OrderStatusExtrusionDetail[]
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
  reworkRepairInfo: ReworkRepairInfo
}

export interface OrderStatusDashboardResult {
  items: OrderStatusDashboardItem[]
  total: number
  jobColumns: OrderStatusJobColumn[]
  productionItemCount: number
  materialTransferCount: number
}

export interface OrderStatusDashboardFilters {
  customer?: string
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

function normalizeStringArray(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.filter((item) => Boolean(normalizeText(item)))
  }

  const normalized = normalizeText(value)
  return normalized ? [normalized] : []
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

async function getAllProcessStandardJobRows(signal?: AbortSignal) {
  const rows: ProcessStandardJobRow[] = []
  let from = 0

  while (true) {
    const to = from + LOOKUP_PAGE_SIZE - 1
    let query = supabase
      .from('process_standards')
      .select(PROCESS_STANDARD_JOB_SELECT)
      .not('job_name', 'is', null)
      .not('operation', 'is', null)
      .order('job_name', { ascending: true })
      .order('model', { ascending: true })
      .order('operation', { ascending: true })
      .range(from, to)

    if (signal) {
      query = query.abortSignal(signal)
    }

    const { data, error } = await query

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

function buildReworkRepairInfo(
  reworkRepairRows: {
    workflow_status: string
    quantity: number
  }[] | null,
): ReworkRepairInfo {
  const info: ReworkRepairInfo = {
    totalQuantity: 0,
    pendingWorkshopCount: 0,
    pendingProductionCount: 0,
    pendingTechnicalCount: 0,
    pendingQualityCount: 0,
    completedCount: 0,
  }

  for (const row of reworkRepairRows ?? []) {
    const quantity = Number(row.quantity || 0)
    info.totalQuantity += quantity

    switch (row.workflow_status) {
      case 'workshop_pending':
        info.pendingWorkshopCount += quantity
        break
      case 'production_pending':
        info.pendingProductionCount += quantity
        break
      case 'technical_pending':
        info.pendingTechnicalCount += quantity
        break
      case 'quality_pending':
        info.pendingQualityCount += quantity
        break
      case 'completed':
        info.completedCount += quantity
        break
    }
  }

  return info
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

async function getOrderStatusDashboardRpcResult({
  page,
  pageSize,
  filters,
  signal,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
  signal?: AbortSignal
}): Promise<OrderStatusDashboardRpcResult> {
  const rpcClient = supabase as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => ReturnType<typeof supabase.rpc>
  }
  let query = rpcClient.rpc('get_order_status_dashboard_v2', {
    p_customer: filters?.customer || null,
    p_material_code: filters?.materialCode || null,
    p_model_keywords: normalizeSearchKeywords(filters?.model) || null,
    p_order_date: filters?.orderDate || null,
    p_page: page,
    p_page_size: pageSize,
    p_production_status: filters?.productionStatus || null,
    p_project_no: filters?.projectNo || null,
    p_status: filters?.status || null,
  })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error } = await query

  if (error) {
    throw handleApiError(error, '获取订单现状聚合数据失败')
  }

  return (data || {}) as OrderStatusDashboardRpcResult
}

export async function getOrderStatusDashboard({
  page,
  pageSize,
  filters,
  signal,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
  signal?: AbortSignal
}): Promise<OrderStatusDashboardResult> {
  const [rpcResult, processRows] = await Promise.all([
    getOrderStatusDashboardRpcResult({ page, pageSize, filters, signal }),
    getAllProcessStandardJobRows(signal),
  ])
  const orders = rpcResult.items ?? []
  const total = rpcResult.total ?? 0
  const processJobIndex = buildProcessJobIndex(processRows)
  const jobColumns = buildJobColumns(processJobIndex)

  const items = orders.map<OrderStatusDashboardItem>((order) => {
    const projectNo = normalizeText(order.project_no)
    const relatedRows = order.productionRows ?? []
    const jobOutputs = Object.fromEntries(
      jobColumns.map((column) => [column.key, 0]),
    ) as Record<string, number>
    const productionDetails: OrderStatusProductionDetail[] = []

    for (const row of relatedRows) {
      const operation = normalizeText(row.operation)
      const jobName = resolveProductionJobName({
        order,
        processJobIndex,
        row,
      })
      const qualifiedQuantity = Number(row.qualified_quantity || 0)

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

    return {
      ...order,
      id: order.id || projectNo || crypto.randomUUID(),
      jobOutputs,
      productionDetails,
      totalIncomingQuantity: Number(order.totalIncomingQuantity || 0),
      totalQualifiedQuantity: Number(order.totalQualifiedQuantity || 0),
      totalDefectQuantity: Number(order.totalDefectQuantity || 0),
      precisionCuttingQuantity: Number(order.precisionCuttingQuantity || 0),
      precisionCuttingDetails: order.precisionCuttingDetails ?? [],
      extrusionQuantity: Number(order.extrusionQuantity || 0),
      extrusionDetails: order.extrusionDetails ?? [],
      transferQuantity: Number(order.transferQuantity || 0),
      warehouseTransferQuantity: Number(order.warehouseTransferQuantity || 0),
      transferRecordCount: Number(order.transferRecordCount || 0),
      transferWorkshops: order.transferWorkshops ?? [],
      latestTransferWorkshop: order.latestTransferWorkshop ?? null,
      latestTransferAt: order.latestTransferAt ?? null,
      latestTransferOperatorNames: normalizeStringArray(
        order.latestTransferOperatorNames,
      ),
      transferDetails: order.transferDetails ?? [],
      finishedQuantity: Number(order.finishedQuantity || 0),
      completionRate: order.completionRate,
      yieldRate: order.yieldRate,
      productionStatus: order.productionStatus,
      reworkRepairInfo: buildReworkRepairInfo(order.reworkRepairRows ?? null),
    }
  })

  return {
    items,
    total,
    jobColumns,
    productionItemCount: rpcResult.productionItemCount ?? 0,
    materialTransferCount: rpcResult.materialTransferCount ?? 0,
  }
}
