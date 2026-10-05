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

export interface JintanPartsStockOutListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface JintanProfilesListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface JintanProfilesInventoryListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface JintanProfilesStockInListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface JintanProfilesStockOutListKeyParams {
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
const PARTS_STOCK_OUT_ROOT = 'jintan-parts-stock-out'

const PROFILES_DATA_ROOT = 'jintan-profiles-data'
const PROFILES_INVENTORY_ROOT = 'jintan-profiles-inventory'
const PROFILES_STOCK_IN_ROOT = 'jintan-profiles-stock-in'
const PROFILES_STOCK_OUT_ROOT = 'jintan-profiles-stock-out'

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
    options: (keyword?: string) =>
      [PARTS_INVENTORY_ROOT, 'options', normalizeKeyword(keyword)] as const,
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
  },
  partsStockOut: {
    all: [PARTS_STOCK_OUT_ROOT] as const,
    list: (params: JintanPartsStockOutListKeyParams) =>
      [
        PARTS_STOCK_OUT_ROOT,
        'list',
        { ...params, keyword: normalizeKeyword(params.keyword) },
      ] as const,
  },
  profilesData: {
    all: [PROFILES_DATA_ROOT] as const,
    list: (params: JintanProfilesListKeyParams) =>
      [
        PROFILES_DATA_ROOT,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
  },
  profilesInventory: {
    all: [PROFILES_INVENTORY_ROOT] as const,
    options: (keyword?: string) =>
      [PROFILES_INVENTORY_ROOT, 'options', normalizeKeyword(keyword)] as const,
    list: (params: JintanProfilesInventoryListKeyParams) =>
      [
        PROFILES_INVENTORY_ROOT,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
  },
  profilesStockIn: {
    all: [PROFILES_STOCK_IN_ROOT] as const,
    list: (params: JintanProfilesStockInListKeyParams) =>
      [
        PROFILES_STOCK_IN_ROOT,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
  },
  profilesStockOut: {
    all: [PROFILES_STOCK_OUT_ROOT] as const,
    list: (params: JintanProfilesStockOutListKeyParams) =>
      [
        PROFILES_STOCK_OUT_ROOT,
        'list',
        { ...params, keyword: normalizeKeyword(params.keyword) },
      ] as const,
  },
} as const
