import { buildPostgrestOrIlikeFilter } from '@/utils/postgrestFilters'

export const YOUMAI_PRODUCT_DATA_OPTION_SELECT =
  'id, material_code, material_name, model, specification, specific_gravity'
export const YOUMAI_RAW_MATERIAL_OPTION_SELECT =
  'id, model, specification, quantity'

const YOUMAI_OPTION_MAX_LIMIT = 50

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
  initialQuery: any,
  { signal, limit }: Pick<OptionsQueryParams, 'signal' | 'limit'>,
) {
  let query = initialQuery.limit(clampLimit(limit))

  if (signal) {
    query = query.abortSignal(signal)
  }

  return query
}

export function buildYoumaiProductDataOptionsQuery(
  initialQuery: any,
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
  initialQuery: any,
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
