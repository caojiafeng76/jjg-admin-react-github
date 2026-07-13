type QueryId = number | string

export interface SyneyPoListKeyParams {
  page: number
  pageSize: number
  status?: string
  startDate?: string
  endDate?: string
  keyword?: string
}

function normalizeText(value?: string): string {
  return value?.trim() ?? ''
}

function compareIds(left: string, right: string): number {
  const numericDifference = Number(left) - Number(right)

  return Number.isFinite(numericDifference) && numericDifference !== 0
    ? numericDifference
    : left.localeCompare(right)
}

const all = ['syney-pos'] as const

export const syneyPoKeys = {
  all,
  lists: () => [...all, 'list'] as const,
  list: (params: SyneyPoListKeyParams) =>
    [
      ...syneyPoKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        status: normalizeText(params.status),
        startDate: normalizeText(params.startDate),
        endDate: normalizeText(params.endDate),
        keyword: normalizeText(params.keyword),
      },
    ] as const,
  details: () => [...all, 'detail'] as const,
  detail: (id: QueryId) => [...syneyPoKeys.details(), String(id)] as const,
  selections: () => [...all, 'selected'] as const,
  selected: (ids: readonly QueryId[]) =>
    [...syneyPoKeys.selections(), ids.map(String).sort(compareIds)] as const,
  items: () => [...all, 'item'] as const,
  item: (id: QueryId) => [...syneyPoKeys.items(), String(id)] as const,
  serialNumbers: () => [...all, 'serial-number'] as const,
} as const
