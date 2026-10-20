import type {
  OrderStatusProductionDetail,
  PackagingDashboardWorkOrderRow,
} from '../apiOrderStatusDashboardTypes'
import { PACKAGING_JOB_NAME } from './constants'
import { normalizeText, roundTo } from './textUtils'

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
    current.totalHours
      += (Number(row.work_hours) || 0) + (Number(row.extra_qualified_hours) || 0)

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
      if (dateCompare !== 0)
        return dateCompare
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

export function groupPackagingRowsByProjectNo(
  rows: PackagingDashboardWorkOrderRow[],
) {
  const grouped = new Map<string, OrderStatusProductionDetail[]>()

  for (const detail of buildPackagingProductionDetailsForDashboard(rows)) {
    const projectNo = normalizeText(detail.projectNo)
    if (!projectNo)
      continue

    const current = grouped.get(projectNo) ?? []
    current.push(detail)
    grouped.set(projectNo, current)
  }

  return grouped
}
