import dayjs from 'dayjs'
import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { ProductionOrderDataCategory } from './apiProductionOrderItems'

export interface ProductionDailyReportFilters {
  startDate?: string
  endDate?: string
  dataCategory?: ProductionOrderDataCategory
  projectNo?: string
  productModel?: string
  customerModel?: string
  operation?: string
  employeeId?: string
}

interface ProductionDailyReportItemRow {
  id: string
  data_category: ProductionOrderDataCategory | null
  project_no: string
  product_model: string | null
  customer_model: string | null
  incoming_qualified_quantity: number
  length_mm: number | null
  operation: string
  qualified_quantity: number
  qualified_hours: number | null
  defect_quantity_1: number
  defect_quantity_2: number
  outsource_defect_quantity: number
  outsource_defect_reason: string | null
  outsource_unit: string | null
  setup_defect_quantity: number
  setup_responsible: string | null
  remark: string | null
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
  dataCategory: ProductionOrderDataCategory
  projectNo: string
  productModel: string
  customerModel: string
  incomingQualifiedCount: number
  lengthMm: number | null
  operation: string
  qualifiedCount: number
  defectCount: number
  workHours: number
  employeeName: string
  rawMaterialDefectCount: number
  processingDefectCount: number
  outsourceDefectCount: number
  outsourceDefectReason: string
  outsourceUnit: string
  setupDefectCount: number
  setupResponsible: string
  qualifiedRate: number
  rawMaterialDefectWeightKg: number
  processingDefectWeightKg: number
  outsourceDefectWeightKg: number
  setupDefectWeightKg: number
  remark: string
}

export interface ProductionDailyReportResult {
  rows: ProductionDailyReportRow[]
  operations: string[]
}

interface SalesOrderWeightRow {
  project_no: string | null
  weight_per_meter_kg: number | null
}

const FETCH_BATCH_SIZE = 1000

function buildProductionDailyReportQuery(filters: ProductionDailyReportFilters) {
  let query = supabase.from('production_order_items').select(`
      id,
      data_category,
      project_no,
      product_model,
      customer_model,
  incoming_qualified_quantity,
      length_mm,
      operation,
      qualified_quantity,
      qualified_hours,
      defect_quantity_1,
      defect_quantity_2,
      outsource_defect_quantity,
      outsource_defect_reason,
      outsource_unit,
      setup_defect_quantity,
      setup_responsible,
      remark,
      production_orders!inner(
        order_date,
        employee:employees(id, name)
      )
    `)

  if (filters.startDate) {
    query = query.gte(
      'production_orders.order_date',
      dayjs(filters.startDate).format('YYYY-MM-DD'),
    )
  }

  if (filters.endDate) {
    query = query.lt(
      'production_orders.order_date',
      dayjs(filters.endDate).add(1, 'day').format('YYYY-MM-DD'),
    )
  }

  if (filters.employeeId) {
    query = query.eq('production_orders.employee_id', filters.employeeId)
  }

  if (filters.projectNo) {
    query = query.ilike('project_no', `%${filters.projectNo}%`)
  }

  if (filters.dataCategory) {
    query = query.eq('data_category', filters.dataCategory)
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

function calculateQualifiedRate(
  qualifiedCount: number,
  incomingQualifiedCount: number,
) {
  if (incomingQualifiedCount <= 0) {
    return 0
  }

  return roundTo(qualifiedCount / incomingQualifiedCount, 4)
}

export async function getProductionDailyReport(
  filters: ProductionDailyReportFilters,
): Promise<ProductionDailyReportResult> {
  const items = await getAllReportItems(filters)
  const weightMap = await getProjectWeightMap(items.map((item) => item.project_no))
  const operations = new Set<string>()

  const rows = items
    .map((item) => {
      const employeeName = item.production_orders.employee?.name || '-'
      const normalizedOperation = item.operation.trim() || '未分类'
      const incomingQualifiedCount = Number(item.incoming_qualified_quantity || 0)
      const rawMaterialDefectCount = Number(item.defect_quantity_2 || 0)
      const processingDefectCount = Number(item.defect_quantity_1 || 0)
      const outsourceDefectCount = Number(item.outsource_defect_quantity || 0)
      const setupDefectCount = Number(item.setup_defect_quantity || 0)
      const qualifiedCount = Number(item.qualified_quantity || 0)
      const defectCount =
        rawMaterialDefectCount +
        processingDefectCount +
        outsourceDefectCount +
        setupDefectCount
      const weightPerMeterKg = weightMap.get(item.project_no) || 0
      const lengthMm = Number(item.length_mm || 0)

      operations.add(normalizedOperation)

      return {
        key: item.id,
        orderDate: item.production_orders.order_date,
        dataCategory: item.data_category || 'A',
        projectNo: item.project_no,
        productModel: item.product_model || '-',
        customerModel: item.customer_model || '-',
        incomingQualifiedCount,
        lengthMm: item.length_mm,
        operation: normalizedOperation,
        qualifiedCount,
        defectCount,
        workHours: roundTo(Number(item.qualified_hours || 0)),
        employeeName,
        rawMaterialDefectCount,
        processingDefectCount,
        outsourceDefectCount,
        outsourceDefectReason: item.outsource_defect_reason?.trim() || '-',
        outsourceUnit: item.outsource_unit?.trim() || '-',
        setupDefectCount,
        setupResponsible: item.setup_responsible?.trim() || '-',
        qualifiedRate: calculateQualifiedRate(qualifiedCount, incomingQualifiedCount),
        rawMaterialDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * rawMaterialDefectCount) / 1000,
        ),
        processingDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * processingDefectCount) / 1000,
        ),
        outsourceDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * outsourceDefectCount) / 1000,
        ),
        setupDefectWeightKg: roundTo(
          (weightPerMeterKg * lengthMm * setupDefectCount) / 1000,
        ),
        remark: item.remark?.trim() || '-',
      }
    })
    .sort((left, right) => {
      const dateCompare = right.orderDate.localeCompare(left.orderDate)

      if (dateCompare !== 0) {
        return dateCompare
      }

      const projectCompare = left.projectNo.localeCompare(right.projectNo, 'zh-CN')

      if (projectCompare !== 0) {
        return projectCompare
      }

      return left.operation.localeCompare(right.operation, 'zh-CN')
    })

  return {
    rows,
    operations: Array.from(operations).sort((left, right) =>
      left.localeCompare(right, 'zh-CN'),
    ),
  }
}