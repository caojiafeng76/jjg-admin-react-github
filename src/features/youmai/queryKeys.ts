type QueryId = number | string

export interface YoumaiListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

function normalizeKeyword(keyword?: string): string {
  return keyword?.trim() ?? ''
}

function createMasterDataKeys<const TRoot extends string>(root: TRoot) {
  const all = [root] as const

  return {
    all,
    lists: () => [...all, 'list'] as const,
    list: (params: YoumaiListKeyParams) =>
      [
        ...all,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
    details: () => [...all, 'detail'] as const,
    detail: (id: QueryId) => [...all, 'detail', String(id)] as const,
    options: (keyword?: string) =>
      [...all, 'options', { keyword: normalizeKeyword(keyword) }] as const,
  } as const
}

export interface YoumaiByProductKeyParams {
  productDataId: string
  page: number
  pageSize: number
}

const FINISHED_GOODS_INVENTORY_ROOT = 'youmai-finished-goods-inventory'
const FINISHED_GOODS_STOCK_IN_ROOT = 'youmai-finished-goods-stock-in'
const FINISHED_GOODS_STOCK_OUT_ROOT = 'youmai-finished-goods-stock-out'

export const youmaiKeys = {
  productData: createMasterDataKeys('youmai-product-data'),
  rawMaterialInventory: createMasterDataKeys('youmai-raw-material-inventory'),
  finishedGoodsInventory: {
    all: [FINISHED_GOODS_INVENTORY_ROOT] as const,
    detail: (productDataId: string) =>
      [FINISHED_GOODS_INVENTORY_ROOT, 'detail', productDataId] as const,
    adjustments: (params: YoumaiByProductKeyParams) =>
      [
        FINISHED_GOODS_INVENTORY_ROOT,
        'adjustments',
        {
          productDataId: params.productDataId,
          page: params.page,
          pageSize: params.pageSize,
        },
      ] as const,
  },
  finishedGoodsStockIn: {
    all: [FINISHED_GOODS_STOCK_IN_ROOT] as const,
    byProduct: (params: YoumaiByProductKeyParams) =>
      [
        FINISHED_GOODS_STOCK_IN_ROOT,
        'by-product',
        {
          productDataId: params.productDataId,
          page: params.page,
          pageSize: params.pageSize,
        },
      ] as const,
  },
  finishedGoodsStockOut: {
    all: [FINISHED_GOODS_STOCK_OUT_ROOT] as const,
    byProduct: (params: YoumaiByProductKeyParams) =>
      [
        FINISHED_GOODS_STOCK_OUT_ROOT,
        'by-product',
        {
          productDataId: params.productDataId,
          page: params.page,
          pageSize: params.pageSize,
        },
      ] as const,
  },
} as const
