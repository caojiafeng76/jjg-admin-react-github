import type {
  ToolingFixtureAction,
  ToolingFixtureStatus,
} from './fixtureDomain'
import type { ToolingFixtureDateRange } from '@/services/apiToolingFixture'

export const toolingFixtureKeys = {
  all: ['tooling-fixtures'] as const,
  lists: () => [...toolingFixtureKeys.all, 'list'] as const,
  list: (params: {
    page: number
    pageSize: number
    keyword?: string
    status?: ToolingFixtureStatus
    manufacturedDateRange?: ToolingFixtureDateRange
    updatedDateRange?: ToolingFixtureDateRange
  }) =>
    [
      ...toolingFixtureKeys.lists(),
      {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword?.trim() ?? '',
        status: params.status ?? '',
        dateStart: params.manufacturedDateRange?.start ?? '',
        dateEnd: params.manufacturedDateRange?.end ?? '',
        updatedStart: params.updatedDateRange?.start ?? '',
        updatedEnd: params.updatedDateRange?.end ?? '',
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
