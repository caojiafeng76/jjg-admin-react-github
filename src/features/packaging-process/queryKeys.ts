type QueryId = number | string

export interface PackagingEmployeeListKeyParams {
  page: number
  pageSize: number
  keyword?: string
}

function normalizeKeyword(keyword?: string): string {
  return keyword?.trim() ?? ''
}

const employeeKeys = {
  all: ['packaging-employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (params: PackagingEmployeeListKeyParams) =>
    [
      ...employeeKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: normalizeKeyword(params.keyword),
      },
    ] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: QueryId) => [...employeeKeys.details(), String(id)] as const,
  options: (keyword?: string) =>
    [
      ...employeeKeys.all,
      'options',
      { keyword: normalizeKeyword(keyword) },
    ] as const,
} as const

export const packagingProcessKeys = {
  employees: employeeKeys,
} as const
