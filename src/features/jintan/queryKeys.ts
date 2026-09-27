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

function normalizeKeyword(keyword?: string): string {
  return keyword?.trim() ?? ''
}

const PARTS_DATA_ROOT = 'jintan-parts-data'
const PARTS_INVENTORY_ROOT = 'jintan-parts-inventory'

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
} as const
