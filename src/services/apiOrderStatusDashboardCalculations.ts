import type { WorkshopOrder } from '@/features/workshop/OrderList'
import type {
  OrderStatusProductionDetail,
  PackagingDashboardWorkOrderRow,
  ProcessStandardJobRow,
  ProductionOrderItemDetailRow,
  ProductionOrderItemRow,
  ReworkRepairInfo,
} from './apiOrderStatusDashboardTypes'

const UNMATCHED_JOB_NAME = '未匹配岗位'
export const PACKAGING_JOB_NAME = '包装'

export function normalizeText(value: string | null | undefined) {
  return value?.trim() || null
}

export function addUniqueText(
  target: string[],
  value: string | null | undefined,
) {
  const normalized = normalizeText(value)

  if (normalized && !target.includes(normalized)) {
    target.push(normalized)
  }
}

export function normalizeStringArray(
  value: string[] | string | null | undefined,
) {
  if (Array.isArray(value)) {
    return value.filter((item) => Boolean(normalizeText(item)))
  }

  const normalized = normalizeText(value)
  return normalized ? [normalized] : []
}

export function buildProcessJobKey(
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

export function buildOperationMatchKey(value: string | null | undefined) {
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

export function setUniqueJobMapValue(
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

export function setLastProcessMapValue(
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

export function resolveLastProcessStatus(
  statuses: Array<LastProcessStatus | undefined>,
) {
  for (const status of statuses) {
    if (status !== undefined) {
      return status === true
    }
  }

  return undefined
}

export function getSingleRelation<TRelation>(
  relation: TRelation | TRelation[] | null | undefined,
) {
  return Array.isArray(relation) ? relation[0] || null : relation || null
}

export function getDefectQuantity(row: ProductionOrderItemRow) {
  return (
    Number(row.defect_quantity_1 || 0) +
    Number(row.defect_quantity_2 || 0) +
    Number(row.outsource_defect_quantity || 0) +
    Number(row.setup_defect_quantity || 0)
  )
}

export function buildProductionDetail(
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

export function roundTo(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function getPackagingSurfaceTreatment(
  row: PackagingDashboardWorkOrderRow,
) {
  return row.process_name || row.color_name || ''
}

export function getPackagingDefectiveWeight(
  row: PackagingDashboardWorkOrderRow,
) {
  const defectiveWeight = Number(row.defective_weight_kg)

  if (Number.isFinite(defectiveWeight)) {
    return defectiveWeight
  }

  const defectiveQuantity = Number(row.defective_quantity) || 0
  const lengthMm = Number(row.length_mm) || 0
  const weightPerMeterKg = Number(row.weight_per_meter_kg) || 0

  return (defectiveQuantity * lengthMm * weightPerMeterKg) / 1000
}

export function buildPackagingProductionDetailsForDashboard(
  rows: PackagingDashboardWorkOrderRow[],
): OrderStatusProductionDetail[] {
  const grouped = new Map<
    string,
    {
      createdAt: string
      defectReasons: Set<string>
      defectiveQuantity: number
      defectiveWeight: number
      employees: Set<string>
      ids: string[]
      lengthMm: number | null
      partNo: string | null
      productModel: string | null
      projectNo: string
      quantity: number
      remarks: Set<string>
      standardSeconds: number
      surfaceTreatment: string
      totalHours: number
      weightPerMeterKg: number
      workDate: string
    }
  >()

  for (const row of rows) {
    const workDate = row.work_date || ''
    const productModel = row.product_model || ''
    const projectNo = row.project_no || ''
    const lengthMm = Number(row.length_mm) || 0
    const surfaceTreatment = getPackagingSurfaceTreatment(row)
    const weightPerMeterKg = Number(row.weight_per_meter_kg) || 0
    const key = [
      workDate,
      productModel,
      projectNo,
      lengthMm,
      surfaceTreatment,
      weightPerMeterKg,
    ].join('|')
    const current = grouped.get(key) ?? {
      createdAt: workDate,
      defectReasons: new Set<string>(),
      defectiveQuantity: 0,
      defectiveWeight: 0,
      employees: new Set<string>(),
      ids: [],
      lengthMm: row.length_mm,
      partNo: row.part_no,
      productModel: row.product_model,
      projectNo,
      quantity: 0,
      remarks: new Set<string>(),
      standardSeconds: 0,
      surfaceTreatment,
      totalHours: 0,
      weightPerMeterKg,
      workDate,
    }

    current.ids.push(row.id)
    current.quantity += Number(row.quantity) || 0
    current.defectiveQuantity += Number(row.defective_quantity) || 0
    current.defectiveWeight += getPackagingDefectiveWeight(row)
    current.standardSeconds = Math.max(
      current.standardSeconds,
      Number(row.standard_seconds) || 0,
    )
    current.totalHours +=
      (Number(row.work_hours) || 0) + (Number(row.extra_qualified_hours) || 0)

    if (row.employee_name) {
      current.employees.add(row.employee_name)
    }
    if (row.defect_reason?.trim()) {
      current.defectReasons.add(row.defect_reason.trim())
    }
    if (row.remark?.trim()) {
      current.remarks.add(row.remark.trim())
    }

    grouped.set(key, current)
  }

  return Array.from(grouped.values())
    .sort((left, right) => {
      const dateCompare = right.workDate.localeCompare(left.workDate)
      if (dateCompare !== 0) return dateCompare
      return left.projectNo.localeCompare(right.projectNo)
    })
    .map((row) => {
      const totalHours = roundTo(row.totalHours, 2)

      return {
        id: `packaging:${row.ids.join(',')}`,
        createdAt: row.createdAt,
        updatedAt: row.createdAt,
        dataCategory: '包装生产工单',
        projectNo: row.projectNo,
        productModel: row.productModel,
        customerModel: null,
        lengthMm: row.lengthMm,
        operation: row.surfaceTreatment,
        orderId: '',
        orderDate: row.workDate,
        shift: '',
        operatorName: Array.from(row.employees).join('、') || null,
        workHours: totalHours,
        machineEquipmentId: null,
        machineName: null,
        unifiedDeviceNo: null,
        jobName: PACKAGING_JOB_NAME,
        incomingQualifiedQuantity: 0,
        qualifiedQuantity: Math.round(row.quantity),
        qualifiedHours: totalHours,
        defectQuantity: Math.round(row.defectiveQuantity),
        defectQuantity1: Math.round(row.defectiveQuantity),
        defectQuantity2: 0,
        defectReason1: Array.from(row.defectReasons).join('\n') || null,
        defectReason2: null,
        defectHours: roundTo(row.defectiveWeight, 2),
        outsourceDefectQuantity: 0,
        outsourceDefectReason: null,
        outsourceUnit: null,
        setupDefectQuantity: 0,
        setupResponsible: null,
        standardSeconds: row.standardSeconds,
        theoreticalSeconds: row.standardSeconds,
        remark: Array.from(row.remarks).join('\n') || null,
      }
    })
}

export function buildReworkRepairInfo(
  reworkRepairRows:
    | {
        workflow_status: string
        quantity: number
      }[]
    | null,
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

export function buildProcessJobIndex(processRows: ProcessStandardJobRow[]) {
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

export function resolveProductionJobName({
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

export function isLastProcessProductionRow({
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
      processJobIndex.modelOperationLastProcessMap.get(modelOperationKey),
      processJobIndex.modelOperationTypeBMatchLastProcessMap.get(
        modelOperationMatchKey,
      ),
      processJobIndex.modelOperationMatchLastProcessMap.get(
        modelOperationMatchKey,
      ),
      operationOnlyStatus,
    ]) ?? false
  )
}

export function buildJobColumns({
  lastProcessJobNames,
  lastProcessJobOperations,
}: Pick<
  ReturnType<typeof buildProcessJobIndex>,
  'lastProcessJobNames' | 'lastProcessJobOperations'
>) {
  const jobColumns = lastProcessJobNames.map((jobName) => ({
    key: jobName,
    title: jobName,
    operations: lastProcessJobOperations.get(jobName) ?? [],
  }))

  if (!jobColumns.some((column) => column.key === PACKAGING_JOB_NAME)) {
    jobColumns.push({
      key: PACKAGING_JOB_NAME,
      title: PACKAGING_JOB_NAME,
      operations: [],
    })
  }

  return jobColumns
}

export function groupPackagingRowsByProjectNo(
  rows: PackagingDashboardWorkOrderRow[],
) {
  const grouped = new Map<string, OrderStatusProductionDetail[]>()

  for (const detail of buildPackagingProductionDetailsForDashboard(rows)) {
    const projectNo = normalizeText(detail.projectNo)
    if (!projectNo) continue

    const current = grouped.get(projectNo) ?? []
    current.push(detail)
    grouped.set(projectNo, current)
  }

  return grouped
}
