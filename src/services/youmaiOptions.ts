import { buildPostgrestOrIlikeFilter } from '@/utils/postgrestFilters'

export const YOUMAI_PRODUCT_DATA_OPTION_SELECT =
  'id, material_code, material_name, model, specification, specific_gravity'
export const YOUMAI_RAW_MATERIAL_OPTION_SELECT =
  'id, model, specification, quantity'

const YOUMAI_OPTION_MAX_LIMIT = 50

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
    return YOUMAI_OPTION_MAX_LIMIT
  }

  return Math.min(YOUMAI_OPTION_MAX_LIMIT, Math.max(1, Math.trunc(limit)))
}

interface OptionsQueryParams {
  keyword?: string
  signal?: AbortSignal
  limit?: number
}

function applyLimitAndSignal(
  initialQuery: OptionsQueryBuilder,
  { signal, limit }: Pick<OptionsQueryParams, 'signal' | 'limit'>,
) {
  let query = initialQuery.limit(clampLimit(limit))

  if (signal) {
    query = query.abortSignal(signal)
  }

  return query
}

export function buildYoumaiProductDataOptionsQuery(
  initialQuery: OptionsQueryBuilder,
  { keyword, signal, limit }: OptionsQueryParams,
) {
  let query = initialQuery
  const normalizedKeyword = keyword?.trim()

  if (normalizedKeyword) {
    query = query.or(
      buildPostgrestOrIlikeFilter(
        ['material_code', 'material_name', 'model', 'specification'],
        normalizedKeyword,
      ),
    )
  }

  query = query
    .order('material_code', { ascending: true })
    .order('id', { ascending: true })

  return applyLimitAndSignal(query, { signal, limit })
}

export function buildYoumaiRawMaterialOptionsQuery(
  initialQuery: OptionsQueryBuilder,
  { keyword, signal, limit }: OptionsQueryParams,
) {
  let query = initialQuery
  const normalizedKeyword = keyword?.trim()

  if (normalizedKeyword) {
    query = query.or(
      buildPostgrestOrIlikeFilter(
        ['model', 'specification'],
        normalizedKeyword,
      ),
    )
  }

  query = query
    .order('model', { ascending: true })
    .order('specification', { ascending: true })
    .order('id', { ascending: true })

  return applyLimitAndSignal(query, { signal, limit })
}
