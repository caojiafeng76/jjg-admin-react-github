export function normalizeSearchKeywords(
  value?: string | string[] | null,
): string[] | undefined {
  const rawValues = Array.isArray(value) ? value : [value]

  const keywords = Array.from(
    new Set(
      rawValues
        .flatMap((item) => String(item || '').split(/[\s,，;；]+/))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )

  return keywords.length > 0 ? keywords : undefined
}

export function buildOrIlikeFilter(
  columns: string[],
  keywords: string[],
): string {
  return keywords
    .flatMap((keyword) =>
      columns.map((column) => `${column}.ilike.%${keyword}%`),
    )
    .join(',')
}
