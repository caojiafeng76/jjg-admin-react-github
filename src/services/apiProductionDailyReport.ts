import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'

export interface ProductionDailyReportFilters {
  startDate?: string
  endDate?: string
  projectNo?: string
  productModel?: string
  customerModel?: string
  operation?: string
  employeeId?: string
}

interface ProductionDailyReportItemRow {
  id: string
  project_no: string
  product_model: string | null
  customer_model: string | null
  length_mm: number | null
  operation: string
  qualified_quantity: number
  qualified_hours: number | null
  defect_quantity_1: number
  defect_quantity_2: number
  production_orders: {
    order_date: string
    employee: {
      id: string
      name: string
    } | null
  }
}

export interface ProductionDailyReportRow {
  key: string
  orderDate: string
  projectNo: string
  productModel: string
  customerModel: string
  lengthMm: number | null
  workHours: number
  employeeName: string
  rawMaterialDefectCount: number
  processingDefectCount: number
  rawMaterialDefectWeightKg: number
  processingDefectWeightKg: number
  operationQuantities: Record<string, number>
}

export interface ProductionDailyReportResult {
  rows: ProductionDailyReportRow[]
  operations: string[]
}

interface SalesOrderWeightRow {
  project_no: string | null
  weight_per_meter_kg: number | null
}

interface AggregatedProductionDailyReportRow extends ProductionDailyReportRow {
  orderDates: Set<string>
  employeeNames: Set<string>
  productModels: Set<string>
  customerModels: Set<string>
}

const FETCH_BATCH_SIZE = 1000

function buildProductionDailyReportQuery(filters: ProductionDailyReportFilters) {
  let query = supabase.from('production_order_items').select(`
      id,
      project_no,
      product_model,
      customer_model,
      length_mm,
      operation,
      qualified_quantity,
      qualified_hours,
      defect_quantity_1,
      defect_quantity_2,
      production_orders!inner(
        order_date,
        employee:employees(id, name)
      )
    `)

  if (filters.startDate) {
    query = query.gte('production_orders.order_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('production_orders.order_date', filters.endDate)
  }

  if (filters.employeeId) {
    query = query.eq('production_orders.employee_id', filters.employeeId)
  }

  if (filters.projectNo) {
    query = query.ilike('project_no', `%${filters.projectNo}%`)
  }

  if (filters.productModel) {
    query = query.ilike('product_model', `%${filters.productModel}%`)
  }

  if (filters.customerModel) {
    query = query.ilike('customer_model', `%${filters.customerModel}%`)
  }

  if (filters.operation) {
    query = query.ilike('operation', `%${filters.operation}%`)
  }

  return query
}

async function getAllReportItems(filters: ProductionDailyReportFilters) {
  const items: ProductionDailyReportItemRow[] = []
  let from = 0

  while (true) {
    const to = from + FETCH_BATCH_SIZE - 1
    const { data, error } = await buildProductionDailyReportQuery(filters)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      throw handleApiError(error, '获取生产日报表数据失败')
    }

    const batch = (data || []) as unknown as ProductionDailyReportItemRow[]
    items.push(...batch)

    if (batch.length < FETCH_BATCH_SIZE) {
      break
    }

    from += FETCH_BATCH_SIZE
  }

  return items
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

async function getProjectWeightMap(projectNos: string[]) {
  const weightMap = new Map<string, number>()
  const uniqueProjectNos = Array.from(new Set(projectNos.filter(Boolean)))

  for (const chunk of chunkArray(uniqueProjectNos, FETCH_BATCH_SIZE)) {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('project_no, weight_per_meter_kg')
      .in('project_no', chunk)

    if (error) {
      throw handleApiError(error, '获取项目比重失败')
    }

    ;((data || []) as SalesOrderWeightRow[]).forEach((item) => {
      if (item.project_no) {
        weightMap.set(item.project_no, Number(item.weight_per_meter_kg || 0))
      }
    })
  }

  return weightMap
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function createReportKey(item: ProductionDailyReportItemRow) {
  return item.project_no || '未填写项目号'
}

function mergeDisplayValues(values: Set<string>, fallback = '-') {
  const normalizedValues = Array.from(values)
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))

  if (normalizedValues.length === 0) {
    return fallback
  }

  return normalizedValues.join('、')
}

function formatOrderDateRange(values: Set<string>) {
  const dates = Array.from(values).sort((left, right) => left.localeCompare(right))

  if (dates.length === 0) {
    return '-'
  }

  if (dates.length === 1) {
    return dates[0]
  }

  return `${dates[0]} ~ ${dates[dates.length - 1]}`
}

export async function getProductionDailyReport(
  filters: ProductionDailyReportFilters,
): Promise<ProductionDailyReportResult> {
  const items = await getAllReportItems(filters)
  const weightMap = await getProjectWeightMap(items.map((item) => item.project_no))
  const reportMap = new Map<string, AggregatedProductionDailyReportRow>()
  const operations = new Set<string>()

  items.forEach((item) => {
    const employeeName = item.production_orders.employee?.name || '-'
    const key = createReportKey(item)
    const normalizedOperation = item.operation.trim() || '未分类'
    const current = reportMap.get(key)
    const weightPerMeterKg = weightMap.get(item.project_no) || 0
    const lengthMm = Number(item.length_mm || 0)

    operations.add(normalizedOperation)

    if (!current) {
      reportMap.set(key, {
        key,
        orderDate: item.production_orders.order_date,
        projectNo: item.project_no,
        productModel: item.product_model || '-',
        customerModel: item.customer_model || '-',
        lengthMm: item.length_mm,
        workHours: Number(item.qualified_hours || 0),
        employeeName,
        rawMaterialDefectCount: Number(item.defect_quantity_2 || 0),
        processingDefectCount: Number(item.defect_quantity_1 || 0),
        rawMaterialDefectWeightKg:
          (weightPerMeterKg * lengthMm * Number(item.defect_quantity_2 || 0)) /
          1000,
        processingDefectWeightKg:
          (weightPerMeterKg * lengthMm * Number(item.defect_quantity_1 || 0)) /
          1000,
        operationQuantities: {
          [normalizedOperation]: Number(item.qualified_quantity || 0),
        },
        orderDates: new Set([item.production_orders.order_date]),
        employeeNames: new Set([employeeName]),
        productModels: new Set([item.product_model || '-']),
        customerModels: new Set([item.customer_model || '-']),
      })
      return
    }

    current.orderDates.add(item.production_orders.order_date)
    current.employeeNames.add(employeeName)
    current.productModels.add(item.product_model || '-')
    current.customerModels.add(item.customer_model || '-')
    current.workHours += Number(item.qualified_hours || 0)
    current.rawMaterialDefectCount += Number(item.defect_quantity_2 || 0)
    current.processingDefectCount += Number(item.defect_quantity_1 || 0)
    current.rawMaterialDefectWeightKg +=
      (weightPerMeterKg * lengthMm * Number(item.defect_quantity_2 || 0)) / 1000
    current.processingDefectWeightKg +=
      (weightPerMeterKg * lengthMm * Number(item.defect_quantity_1 || 0)) / 1000
    current.operationQuantities[normalizedOperation] =
      Number(current.operationQuantities[normalizedOperation] || 0) +
      Number(item.qualified_quantity || 0)
  })

  const rows = Array.from(reportMap.values())
    .map((row) => ({
      ...row,
      orderDate: formatOrderDateRange(row.orderDates),
      employeeName: mergeDisplayValues(row.employeeNames),
      productModel: mergeDisplayValues(row.productModels),
      customerModel: mergeDisplayValues(row.customerModels),
      workHours: roundTo(row.workHours),
      rawMaterialDefectWeightKg: roundTo(row.rawMaterialDefectWeightKg),
      processingDefectWeightKg: roundTo(row.processingDefectWeightKg),
    }))
    .sort((left, right) => {
      const projectCompare = left.projectNo.localeCompare(right.projectNo, 'zh-CN')

      if (projectCompare !== 0) {
        return projectCompare
      }

      return right.orderDate.localeCompare(left.orderDate)
    })

  return {
    rows,
    operations: Array.from(operations).sort((left, right) =>
      left.localeCompare(right, 'zh-CN'),
    ),
  }
}