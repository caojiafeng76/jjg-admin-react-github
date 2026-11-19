import type { WorkshopMiscMaterialsReportStage } from '@/services/apiWorkshopMiscMaterialsReport'
import type { WorkshopMiscMaterialsStockDirection } from '@/services/apiWorkshopMiscMaterialsStock'
import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { normalizeWorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'

export interface WorkshopMiscMaterialsListKeyParams {
  page: number
  pageSize: number
  filters?: WorkshopMiscMaterialsSearchFilters
  keyword?: string
}

export interface WorkshopMiscMaterialsByInventoryKeyParams {
  inventoryId: string
  page: number
  pageSize: number
}

const DATA_ROOT = 'workshop-misc-materials-data'
const CATEGORIES_ROOT = 'workshop-misc-materials-categories'
const INVENTORY_ROOT = 'workshop-misc-materials-inventory'
const STOCK_IN_ROOT = 'workshop-misc-materials-stock-in'
const STOCK_OUT_ROOT = 'workshop-misc-materials-stock-out'
const MONTHLY_REPORT_ROOT = 'workshop-misc-materials-monthly-report'

function listParams(params: WorkshopMiscMaterialsListKeyParams) {
  const keyword = params.keyword?.trim()
  return {
    page: params.page,
    pageSize: params.pageSize,
    filters: normalizeWorkshopMiscMaterialsSearchFilters(params.filters),
    ...(keyword ? { keyword } : {}),
  }
}

function byInventoryParams(params: WorkshopMiscMaterialsByInventoryKeyParams) {
  return {
    inventoryId: params.inventoryId,
    page: params.page,
    pageSize: params.pageSize,
  }
}

function createStockKeys<Root extends string>(root: Root) {
  return {
    all: [root] as const,
    list: (params: WorkshopMiscMaterialsListKeyParams) =>
      [root, 'list', listParams(params)] as const,
    byInventory: (params: WorkshopMiscMaterialsByInventoryKeyParams) =>
      [root, 'by-inventory', byInventoryParams(params)] as const,
  }
}

const stockIn = createStockKeys(STOCK_IN_ROOT)
const stockOut = createStockKeys(STOCK_OUT_ROOT)

export const workshopMiscMaterialsKeys = {
  data: {
    all: [DATA_ROOT] as const,
    list: (params: WorkshopMiscMaterialsListKeyParams) =>
      [DATA_ROOT, 'list', listParams(params)] as const,
  },
  categories: {
    all: [CATEGORIES_ROOT] as const,
  },
  inventory: {
    all: [INVENTORY_ROOT] as const,
    detail: (dataId: string) => [INVENTORY_ROOT, 'detail', dataId] as const,
    options: (keyword?: string) =>
      [INVENTORY_ROOT, 'options', keyword?.trim() ?? ''] as const,
    list: (params: WorkshopMiscMaterialsListKeyParams) =>
      [INVENTORY_ROOT, 'list', listParams(params)] as const,
    adjustments: (params: WorkshopMiscMaterialsByInventoryKeyParams) =>
      [INVENTORY_ROOT, 'adjustments', byInventoryParams(params)] as const,
  },
  stockIn,
  stockOut,
  stock: (direction: WorkshopMiscMaterialsStockDirection) =>
    direction === 'in' ? stockIn : stockOut,
  monthlyReport: {
    all: [MONTHLY_REPORT_ROOT] as const,
    detail: (month: string, stage: WorkshopMiscMaterialsReportStage) =>
      [MONTHLY_REPORT_ROOT, 'detail', month, stage] as const,
  },
} as const
