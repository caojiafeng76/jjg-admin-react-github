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

export const youmaiKeys = {
  productData: createMasterDataKeys('youmai-product-data'),
  rawMaterialInventory: createMasterDataKeys('youmai-raw-material-inventory'),
} as const
