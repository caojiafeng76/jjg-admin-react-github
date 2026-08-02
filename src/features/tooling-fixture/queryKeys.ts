import type {
  ToolingFixtureAction,
  ToolingFixtureStatus,
} from './fixtureDomain'

export const toolingFixtureKeys = {
  all: ['tooling-fixtures'] as const,
  lists: () => [...toolingFixtureKeys.all, 'list'] as const,
  list: (params: {
    page: number
    pageSize: number
    keyword?: string
    status?: ToolingFixtureStatus
  }) =>
    [
      ...toolingFixtureKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword?.trim() ?? '',
        status: params.status ?? '',
      },
    ] as const,
  records: () => [...toolingFixtureKeys.all, 'records'] as const,
  recordList: (params: {
    page: number
    pageSize: number
    action?: ToolingFixtureAction
  }) =>
    [
      ...toolingFixtureKeys.records(),
      {
        page: params.page,
        pageSize: params.pageSize,
        action: params.action ?? '',
      },
    ] as const,
  public: (qrToken: string) =>
    [...toolingFixtureKeys.all, 'public', qrToken] as const,
} as const
