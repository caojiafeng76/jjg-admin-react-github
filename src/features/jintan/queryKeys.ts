export interface JintanPartsListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface JintanPartsInventoryListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface JintanPartsStockInListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

function normalizeKeyword(keyword?: string): string {
  return keyword?.trim() ?? ''
}

const PARTS_DATA_ROOT = 'jintan-parts-data'
const PARTS_INVENTORY_ROOT = 'jintan-parts-inventory'
const PARTS_STOCK_IN_ROOT = 'jintan-parts-stock-in'

export const jintanKeys = {
  partsData: {
    all: [PARTS_DATA_ROOT] as const,
    list: (params: JintanPartsListKeyParams) =>
      [
        PARTS_DATA_ROOT,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
  },
  partsInventory: {
    all: [PARTS_INVENTORY_ROOT] as const,
    list: (params: JintanPartsInventoryListKeyParams) =>
      [
        PARTS_INVENTORY_ROOT,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
  },
  partsStockIn: {
    all: [PARTS_STOCK_IN_ROOT] as const,
    list: (params: JintanPartsStockInListKeyParams) =>
      [
        PARTS_STOCK_IN_ROOT,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
    options: (keyword?: string) =>
      [PARTS_STOCK_IN_ROOT, 'options', normalizeKeyword(keyword)] as const,
  },
} as const
