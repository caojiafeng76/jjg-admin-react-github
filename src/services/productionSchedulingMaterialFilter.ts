export const PRODUCTION_SCHEDULING_MATERIAL_CODE_PREFIXES = [
  '01.',
  '02.',
  '03.',
] as const
export const PRODUCTION_SCHEDULING_MATERIAL_CODE_OR_FILTER =
  PRODUCTION_SCHEDULING_MATERIAL_CODE_PREFIXES.map(
    (prefix) => `material_code.ilike.${prefix}%`,
  ).join(',')

export function isProductionSchedulingMaterialCode(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    PRODUCTION_SCHEDULING_MATERIAL_CODE_PREFIXES.some((prefix) =>
      value.trim().startsWith(prefix),
    )
  )
}
