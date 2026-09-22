export interface JintanPartsListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

function normalizeKeyword(keyword?: string): string {
  return keyword?.trim() ?? ''
}

const ROOT = 'jintan-parts-data'

export const jintanKeys = {
  partsData: {
    all: [ROOT] as const,
    list: (params: JintanPartsListKeyParams) =>
      [
        ROOT,
        'list',
        {
          page: params.page,
          pageSize: params.pageSize,
          keyword: normalizeKeyword(params.keyword),
        },
      ] as const,
  },
} as const
