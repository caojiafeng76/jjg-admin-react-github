type QueryId = number | string

export interface SyneyPoListKeyParams {
  page: number
  pageSize: number
  status?: string
  startDate?: string
  endDate?: string
  keyword?: string
}

export interface SyneyReportListKeyParams {
  page: number
  pageSize: number
  status?: string
}

export interface SyneySpecListKeyParams {
  page: number
  pageSize: number
  partNo?: string
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

function normalizeSelectionTexts(values: readonly QueryId[]): string[] {
  return Array.from(
    new Set(values.map(value => String(value).trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right))
}

const poAll = ['syney-pos'] as const
const reportAll = ['syney-reports'] as const
const specAll = ['syney-specs'] as const
const safePartSettingsAll = ['syney-safe-part-settings'] as const

const poKeys = {
  all: poAll,
  lists: () => [...poAll, 'list'] as const,
  list: (params: SyneyPoListKeyParams) =>
    [
      ...poKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        status: normalizeText(params.status),
        startDate: normalizeText(params.startDate),
        endDate: normalizeText(params.endDate),
        keyword: normalizeText(params.keyword),
      },
    ] as const,
  details: () => [...poAll, 'detail'] as const,
  detail: (id: QueryId) => [...poKeys.details(), String(id)] as const,
  selections: () => [...poAll, 'selected'] as const,
  selected: (ids: readonly QueryId[]) =>
    [...poKeys.selections(), ids.map(String).sort(compareIds)] as const,
  items: () => [...poAll, 'item'] as const,
  item: (id: QueryId) => [...poKeys.items(), String(id)] as const,
  serialNumbers: () => [...poAll, 'serial-number'] as const,
} as const

const reportKeys = {
  all: reportAll,
  lists: () => [...reportAll, 'list'] as const,
  list: (params: SyneyReportListKeyParams) =>
    [
      ...reportKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        status: normalizeText(params.status) || 'all',
      },
    ] as const,
  details: () => [...reportAll, 'detail'] as const,
  detail: (reportNo: string) =>
    [...reportKeys.details(), normalizeText(reportNo)] as const,
  headers: () => [...reportAll, 'header'] as const,
  header: (reportNo: string) =>
    [...reportKeys.headers(), normalizeText(reportNo)] as const,
  selections: () => [...reportAll, 'selected'] as const,
  selected: (reportNos: readonly string[]) =>
    [...reportKeys.selections(), normalizeSelectionTexts(reportNos)] as const,
} as const

const specKeys = {
  all: specAll,
  lists: () => [...specAll, 'list'] as const,
  list: (params: SyneySpecListKeyParams) =>
    [
      ...specKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        partNo: normalizeText(params.partNo),
      },
    ] as const,
  listAll: () => [...specAll, 'all'] as const,
} as const

const safePartSettingsKeys = {
  all: safePartSettingsAll,
} as const

export const syneyKeys = {
  po: poKeys,
  report: reportKeys,
  spec: specKeys,
  safePartSettings: safePartSettingsKeys,
} as const

export const syneyPoKeys = syneyKeys.po
