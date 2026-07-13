import { buildPostgrestOrIlikeFilter } from '@/utils/postgrestFilters'

export const TOOLING_DATA_OPTION_SELECT =
  'id, tool_code, tool_name, tool_spec, material, unit_price'

export const TOOLING_DATA_OPTION_MAX_LIMIT = 50

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return TOOLING_DATA_OPTION_MAX_LIMIT
  }

  return Math.min(TOOLING_DATA_OPTION_MAX_LIMIT, Math.max(1, Math.trunc(limit)))
}

export function buildToolingDataOptionsQuery(
  initialQuery: any,
  {
    keyword,
    signal,
    limit,
  }: {
    keyword?: string
    signal?: AbortSignal
    limit?: number
  },
) {
  let query = initialQuery
  const normalizedKeyword = keyword?.trim()

  if (normalizedKeyword) {
    query = query.or(
      buildPostgrestOrIlikeFilter(
        ['tool_code', 'tool_name', 'tool_spec', 'material'],
        normalizedKeyword,
      ),
    )
  }

  query = query
    .order('tool_code', { ascending: true })
    .order('id', { ascending: true })
    .limit(clampLimit(limit))

  if (signal) {
    query = query.abortSignal(signal)
  }

  return query
}
