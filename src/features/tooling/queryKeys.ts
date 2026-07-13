type QueryId = number | string

export interface ToolingDataListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface ToolingMovementListKeyParams extends ToolingDataListKeyParams {
  status?: '待审核' | '已审核'
}

function normalizeKeyword(keyword?: string): string {
  return keyword?.trim() ?? ''
}

const dataKeys = {
  all: ['tooling-data'] as const,
  lists: () => [...dataKeys.all, 'list'] as const,
  list: (params: ToolingDataListKeyParams) =>
    [
      ...dataKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: normalizeKeyword(params.keyword),
      },
    ] as const,
  details: () => [...dataKeys.all, 'detail'] as const,
  detail: (id: QueryId) => [...dataKeys.details(), String(id)] as const,
  options: (keyword?: string) =>
    [
      ...dataKeys.all,
      'options',
      { keyword: normalizeKeyword(keyword) },
    ] as const,
  publicOptions: (keyword?: string) =>
    [
      ...dataKeys.all,
      'public-options',
      { keyword: normalizeKeyword(keyword) },
    ] as const,
} as const

const inventoryKeys = {
  all: ['tooling-inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (params: ToolingDataListKeyParams) =>
    [
      ...inventoryKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: normalizeKeyword(params.keyword),
      },
    ] as const,
} as const

function createMovementKeys(root: 'tooling-stock-in' | 'tooling-stock-out') {
  const keys = {
    all: [root] as const,
    lists: () => [...keys.all, 'list'] as const,
    list: (params: ToolingMovementListKeyParams) =>
      [
        ...keys.lists(),
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
          status: params.status ?? '',
        },
      ] as const,
  } as const

  return keys
}

const stockInKeys = createMovementKeys('tooling-stock-in')
const stockOutKeys = createMovementKeys('tooling-stock-out')

export const toolingKeys = {
  data: dataKeys,
  inventory: inventoryKeys,
  stockIn: stockInKeys,
  stockOut: stockOutKeys,
} as const
