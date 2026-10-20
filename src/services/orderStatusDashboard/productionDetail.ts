import type {
  OrderStatusProductionDetail,
  ProductionOrderItemDetailRow,
  ProductionOrderItemRow,
  ReworkRepairInfo,
} from '../apiOrderStatusDashboardTypes'
import { AUTO_CUT_JOB_NAMES } from './constants'
import { getSingleRelation, roundTo, toFiniteNumber } from './textUtils'

export function getDefectQuantity(row: ProductionOrderItemRow) {
  return (
    Number(row.defect_quantity_1 || 0)
    + Number(row.defect_quantity_2 || 0)
    + Number(row.outsource_defect_quantity || 0)
    + Number(row.setup_defect_quantity || 0)
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

export function getAutoCutQuantity(jobOutputs: Record<string, number>) {
  return roundTo(
    AUTO_CUT_JOB_NAMES.reduce(
      (total, jobName) => total + toFiniteNumber(jobOutputs[jobName]),
      0,
    ),
    3,
  )
}

/** 库存 = 精切转入 + 自动切合格 - 各工序报废 - 转移出去（允许为负，如实暴露数据异常） */
export function calculateInventoryQuantity({
  autoCutQuantity,
  defectQuantity,
  precisionCuttingQuantity,
  transferQuantity,
}: {
  autoCutQuantity: number
  defectQuantity: number
  precisionCuttingQuantity: number
  transferQuantity: number
}) {
  return roundTo(
    toFiniteNumber(precisionCuttingQuantity)
    + toFiniteNumber(autoCutQuantity)
    - toFiniteNumber(defectQuantity)
    - toFiniteNumber(transferQuantity),
    3,
  )
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
