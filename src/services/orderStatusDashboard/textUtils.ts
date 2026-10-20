export function normalizeText(value: string | null | undefined) {
  return value?.trim() || null
}

export function addUniqueText(
  target: string[],
  value: string | null | undefined,
) {
  const normalized = normalizeText(value)

  if (normalized && !target.includes(normalized)) {
    target.push(normalized)
  }
}

export function normalizeStringArray(
  value: string[] | string | null | undefined,
) {
  if (Array.isArray(value)) {
    return value.filter(item => Boolean(normalizeText(item)))
  }

  const normalized = normalizeText(value)
  return normalized ? [normalized] : []
}

export function getSingleRelation<TRelation>(
  relation: TRelation | TRelation[] | null | undefined,
) {
  return Array.isArray(relation) ? relation[0] || null : relation || null
}

export function roundTo(value: number, precision = 2) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

export function toFiniteNumber(value: unknown) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}
