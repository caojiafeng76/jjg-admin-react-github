import type { SyneyMaterialsStockDirection } from '@/services/apiSyneyMaterialsStock'
import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { normalizeJintanSearchFilters } from '@/services/jintanSearchFields'

export interface SyneyMaterialsListKeyParams {
  page: number
  pageSize: number
  filters?: SyneyMaterialsSearchFilters
  /** 手机端单关键词；PC 页面不传，key 保持不变 */
  keyword?: string
}

export interface SyneyMaterialsByInventoryKeyParams {
  inventoryId: string
  page: number
  pageSize: number
}

const DATA_ROOT = 'syney-materials-data'
const INVENTORY_ROOT = 'syney-materials-inventory'
const STOCK_IN_ROOT = 'syney-materials-stock-in'
const STOCK_OUT_ROOT = 'syney-materials-stock-out'
const MONTHLY_REPORT_ROOT = 'syney-materials-monthly-report'

function listParams(params: SyneyMaterialsListKeyParams) {
  const keyword = params.keyword?.trim()
  return {
    page: params.page,
    pageSize: params.pageSize,
    filters: normalizeJintanSearchFilters(params.filters),
    ...(keyword ? { keyword } : {}),
  }
}

function byInventoryParams(params: SyneyMaterialsByInventoryKeyParams) {
  return {
    inventoryId: params.inventoryId,
    page: params.page,
    pageSize: params.pageSize,
  }
}

function createStockKeys<Root extends string>(root: Root) {
  return {
    all: [root] as const,
    list: (params: SyneyMaterialsListKeyParams) =>
      [root, 'list', listParams(params)] as const,
    byInventory: (params: SyneyMaterialsByInventoryKeyParams) =>
      [root, 'by-inventory', byInventoryParams(params)] as const,
  }
}

const stockIn = createStockKeys(STOCK_IN_ROOT)
const stockOut = createStockKeys(STOCK_OUT_ROOT)

export const syneyMaterialsKeys = {
  data: {
    all: [DATA_ROOT] as const,
    list: (params: SyneyMaterialsListKeyParams) =>
      [DATA_ROOT, 'list', listParams(params)] as const,
  },
  inventory: {
    all: [INVENTORY_ROOT] as const,
    /** 资料详情抽屉内的库存摘要，挂在库存根下，出入库后随库存一起刷新 */
    detail: (dataId: string) => [INVENTORY_ROOT, 'detail', dataId] as const,
    options: (keyword?: string) =>
      [INVENTORY_ROOT, 'options', keyword?.trim() ?? ''] as const,
    list: (params: SyneyMaterialsListKeyParams) =>
      [INVENTORY_ROOT, 'list', listParams(params)] as const,
    adjustments: (params: SyneyMaterialsByInventoryKeyParams) =>
      [INVENTORY_ROOT, 'adjustments', byInventoryParams(params)] as const,
  },
  stockIn,
  stockOut,
  stock: (direction: SyneyMaterialsStockDirection) =>
    direction === 'in' ? stockIn : stockOut,
  monthlyReport: {
    all: [MONTHLY_REPORT_ROOT] as const,
    detail: (month: string) => [MONTHLY_REPORT_ROOT, 'detail', month] as const,
  },
} as const
