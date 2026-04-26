import dayjs from 'dayjs'

import type { WorkshopOrder } from '@/features/workshop/OrderList'
import { handleApiError } from '@/utils/errorHandler'
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
>

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

export interface OrderStatusMaterialTransferDetail {
  createdAt: string
  isAudited: boolean
  operatorNames: string[]
  recipientName: string
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
  model?: string
  orderDate?: string
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

  const withoutParenthetical = normalized
    .replace(/[（(][^（）()]*[）)]/g, '')
    .replace(/\s+/g, '')

  return withoutParenthetical || normalized.replace(/\s+/g, '')
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
      .select('job_name, operation, model, length, part_no, record_type')
      .order('job_name', { ascending: true })
      .order('model', { ascending: true })
      .order('operation', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取成本核算岗位信息失败')
    }

    const pageRows = (data || []) as ProcessStandardJobRow[]
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
  const exactMap = new Map<string, string>()
  const exactOperationMatchMap = new Map<string, string>()
  const modelOperationMap = new Map<string, string>()
  const modelOperationMatchMap = new Map<string, string>()
  const modelOperationTypeBMap = new Map<string, string>()
  const modelOperationTypeBMatchMap = new Map<string, string>()
  const operationMap = new Map<string, string>()
  const operationMatchMap = new Map<string, string>()
  const ambiguousExactOperationMatchKeys = new Set<string>()
  const ambiguousModelOperationMatchKeys = new Set<string>()
  const ambiguousModelOperationTypeBMatchKeys = new Set<string>()
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

    const modelOperationKey = buildProcessJobKey(row.model, operation)
    const operationMatchKey = buildOperationMatchKey(operation)
    const modelOperationMatchKey = operationMatchKey
      ? buildProcessJobKey(row.model, operationMatchKey)
      : null

    if (!modelOperationMap.has(modelOperationKey)) {
      modelOperationMap.set(modelOperationKey, jobName)
    }

    if (modelOperationMatchKey) {
      setUniqueJobMapValue(
        modelOperationMatchMap,
        ambiguousModelOperationMatchKeys,
        modelOperationMatchKey,
        jobName,
      )
    }

    if (
      row.record_type === 'B' &&
      !modelOperationTypeBMap.has(modelOperationKey)
    ) {
      modelOperationTypeBMap.set(modelOperationKey, jobName)
    }

    if (row.record_type === 'B' && modelOperationMatchKey) {
      setUniqueJobMapValue(
        modelOperationTypeBMatchMap,
        ambiguousModelOperationTypeBMatchKeys,
        modelOperationMatchKey,
        jobName,
      )
    }

    const exactKey = buildProcessJobKey(
      row.model,
      operation,
      row.part_no,
      row.length,
    )

    if (row.record_type === 'A' && !exactMap.has(exactKey)) {
      exactMap.set(exactKey, jobName)
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
    }

    if (!operationMap.has(operation)) {
      operationMap.set(operation, jobName)
    }

    if (operationMatchKey) {
      setUniqueJobMapValue(
        operationMatchMap,
        ambiguousOperationMatchKeys,
        operationMatchKey,
        jobName,
      )
    }
  }

  return {
    exactMap,
    exactOperationMatchMap,
    jobNames,
    jobOperations,
    modelOperationMap,
    modelOperationMatchMap,
    modelOperationTypeBMap,
    modelOperationTypeBMatchMap,
    operationMap,
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

  if (!operation || !model) {
    return UNMATCHED_JOB_NAME
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
    processJobIndex.operationMap.get(operation) ||
    processJobIndex.operationMatchMap.get(operationMatchKey || '') ||
    UNMATCHED_JOB_NAME
  )
}

function buildJobColumns({
  jobNames,
  jobOperations,
}: Pick<
  ReturnType<typeof buildProcessJobIndex>,
  'jobNames' | 'jobOperations'
>) {
  return jobNames.map((jobName) => ({
    key: jobName,
    title: jobName,
    operations: jobOperations.get(jobName) ?? [],
  }))
}

function ensureJobColumn(
  columns: OrderStatusJobColumn[],
  jobName: string,
  operation: string | null | undefined,
) {
  const current = columns.find((column) => column.key === jobName)

  if (current) {
    addUniqueText(current.operations, operation)
    return
  }

  const normalizedOperation = normalizeText(operation)

  columns.push({
    key: jobName,
    title: jobName,
    operations: normalizedOperation ? [normalizedOperation] : [],
  })
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

export async function getOrderStatusDashboard({
  page,
  pageSize,
  filters,
}: {
  page: number
  pageSize: number
  filters?: OrderStatusDashboardFilters
}): Promise<OrderStatusDashboardResult> {
  const [{ items: orders, total }, processRows] = await Promise.all([
    getWorkshopOrders({
      page,
      pageSize,
      product_delivery_date_search: filters?.orderDate,
      project_no: filters?.projectNo,
      model_search: filters?.model ? [filters.model] : undefined,
      status: filters?.status,
    }),
    getAllProcessStandardJobRows(),
  ])

  const projectNos = orders
    .map((order) => normalizeText(order.project_no))
    .filter((projectNo): projectNo is string => Boolean(projectNo))
  const [productionRows, materialTransferRows] = await Promise.all([
    getProductionItemsByProjectNos(projectNos),
    getMaterialTransfersByProjectNos(projectNos),
  ])
  const processJobIndex = buildProcessJobIndex(processRows)
  const jobColumns = buildJobColumns(processJobIndex)
  const materialTransferSummaryMap =
    buildMaterialTransferSummaryMap(materialTransferRows)
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
        ensureJobColumn(jobColumns, jobName, operation)
        jobOutputs[jobName] = (jobOutputs[jobName] || 0) + qualifiedQuantity
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

  return {
    items,
    total,
    jobColumns,
    productionItemCount: productionRows.length,
    materialTransferCount: materialTransferRows.length,
  }
}
