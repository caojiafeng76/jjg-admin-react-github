import type { OrderStatusDashboardItem, OrderStatusJobColumn } from '@/services/apiOrderStatusDashboard'

export function createDashboardOrder(overrides: Partial<OrderStatusDashboardItem> = {}): OrderStatusDashboardItem {
  return {
    id: 'order-1',
    project_no: 'P-1',
    product_model: '105-268',
    length_mm: 250,
    order_quantity: 100,
    customer: '浙江三星新材料股份有限公司',
    customer_model: '美的768东鹏26款新铝合金把手（新款）',
    product_delivery_date: '2026-11-14',
    material_code: '02.105.268.0250.22',
    material_name: '6063',
    status: '生产中',
    weight_per_meter_kg: null,
    color_name: null,
    package_name: null,
    product_category: null,
    jobOutputs: {},
    productionDetails: [],
    totalIncomingQuantity: 0,
    totalQualifiedQuantity: 0,
    totalDefectQuantity: 0,
    precisionCuttingQuantity: 0,
    precisionCuttingDetails: [],
    autoCutQuantity: 0,
    inventoryQuantity: 0,
    extrusionQuantity: 0,
    extrusionDetails: [],
    transferQuantity: 0,
    warehouseTransferQuantity: 0,
    transferRecordCount: 0,
    transferWorkshops: [],
    latestTransferWorkshop: null,
    latestTransferAt: null,
    latestTransferOperatorNames: [],
    transferDetails: [],
    finishedQuantity: 0,
    completionRate: null,
    yieldRate: null,
    productionStatus: '延期',
    reworkRepairInfo: {
      totalQuantity: 0,
      pendingWorkshopCount: 0,
      pendingProductionCount: 0,
      pendingTechnicalCount: 0,
      pendingQualityCount: 0,
      completedCount: 0,
    },
    ...overrides,
  }
}

export const DASHBOARD_JOB_COLUMNS: OrderStatusJobColumn[] = ['钻床', 'CNC', '精切', '切割', '冲床'].map(key => ({ key, title: key, operations: [] }))

export function createScreenshotDashboardOrders(): OrderStatusDashboardItem[] {
  const quantities = [6800, 7400, 1700, 5600, 6200]
  const inventories = [1381, 4318, 1969, 1648, -496]
  const projects = ['26110409-01', '26110609-03', '26110407-03', '26110315-03', '26103001-13']
  const cutting = [4845, 4773, 2421, 2554, 5714]
  const cnc = [2653, 1305, 449, 1753, 5426]
  const punching = [3941, 4067, 450, 2967, 4980]
  const drilling = [2112, 2281, 468, 7900, 1341]
  return quantities.map((quantity, index) => createDashboardOrder({
    id: `order-${index + 1}`,
    project_no: projects[index],
    order_quantity: quantity,
    inventoryQuantity: inventories[index],
    productionStatus: index === 4 ? '正常' : index === 1 ? '预警' : '延期',
    jobOutputs: { 切割: cutting[index], CNC: cnc[index], 冲床: punching[index], 钻床: drilling[index] },
  }))
}
