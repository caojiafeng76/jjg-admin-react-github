import type {
  ProcessStandardJobRow,
  ProductionOrderItemRow,
} from '../apiOrderStatusDashboardTypes'
import type { WorkshopOrder } from '@/features/workshop/OrderList'
import { PACKAGING_JOB_NAME, UNMATCHED_JOB_NAME } from './constants'
import { addUniqueText, normalizeText } from './textUtils'

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
    /(?:上下|左右|[上下左右])+$/g,
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

  const operationOnlyJobName
    = processJobIndex.operationMap.get(operation)
      || processJobIndex.operationMatchMap.get(operationMatchKey || '')
      || UNMATCHED_JOB_NAME

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
    processJobIndex.exactMap.get(exactKey)
    || processJobIndex.exactOperationMatchMap.get(exactOperationMatchKey)
    || processJobIndex.modelOperationTypeBMap.get(modelOperationKey)
    || processJobIndex.modelOperationTypeBMatchMap.get(modelOperationMatchKey)
    || processJobIndex.modelOperationMap.get(modelOperationKey)
    || processJobIndex.modelOperationMatchMap.get(modelOperationMatchKey)
    || operationOnlyJobName
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
  const jobColumns = lastProcessJobNames.map(jobName => ({
    key: jobName,
    title: jobName,
    operations: lastProcessJobOperations.get(jobName) ?? [],
  }))

  if (!jobColumns.some(column => column.key === PACKAGING_JOB_NAME)) {
    jobColumns.push({
      key: PACKAGING_JOB_NAME,
      title: PACKAGING_JOB_NAME,
      operations: [],
    })
  }

  return jobColumns
}
