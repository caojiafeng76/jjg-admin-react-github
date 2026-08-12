import { buildPostgrestOrIlikeFilter } from '@/utils/postgrestFilters'

export const TOOLING_DATA_OPTION_SELECT =
  'id, tool_code, tool_name, tool_spec, material, unit_price'

export const TOOLING_DATA_OPTION_MAX_LIMIT = 50

/**
 * Postgrest 查询构建器的最小结构接口（替代 any）：
 * 仅声明选项构建链路用到的链式方法 + await 结果形态。
 */
interface OptionsQueryBuilder
  extends PromiseLike<{ data: unknown; error: unknown }> {
  or: (filter: string) => OptionsQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => OptionsQueryBuilder
  limit: (limit: number) => OptionsQueryBuilder
  abortSignal: (signal: AbortSignal) => OptionsQueryBuilder
}

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return TOOLING_DATA_OPTION_MAX_LIMIT
  }

  return Math.min(TOOLING_DATA_OPTION_MAX_LIMIT, Math.max(1, Math.trunc(limit)))
}

export function buildToolingDataOptionsQuery(
  initialQuery: OptionsQueryBuilder,
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
