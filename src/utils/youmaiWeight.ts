function parseSpecificationLength(specification: string | null | undefined) {
  const normalized = String(specification || '').trim()
  if (!normalized) {
    return null
  }

  const matched = normalized.match(/\d+(?:\.\d+)?/)
  if (!matched) {
    return null
  }

  const parsed = Number(matched[0])
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export function calculateYoumaiWeightKg({
  specification,
  specificGravity,
  quantity,
}: {
  specification: string | null | undefined
  specificGravity: number | null | undefined
  quantity: number | null | undefined
}) {
  const length = parseSpecificationLength(specification)
  const normalizedSpecificGravity = Number(specificGravity ?? 0)
  const normalizedQuantity = Number(quantity ?? 0)

  if (
    length === null ||
    !Number.isFinite(normalizedSpecificGravity) ||
    normalizedSpecificGravity <= 0 ||
    !Number.isFinite(normalizedQuantity) ||
    normalizedQuantity <= 0
  ) {
    return null
  }

  return (length / 1000) * normalizedSpecificGravity * normalizedQuantity
}
