export const PRODUCTION_SCHEDULING_MATERIAL_CODE_PREFIX = '02.'
export const PRODUCTION_SCHEDULING_MATERIAL_CODE_QUERY_PATTERN = `${PRODUCTION_SCHEDULING_MATERIAL_CODE_PREFIX}%`

export function isProductionSchedulingMaterialCode(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.trim().startsWith(PRODUCTION_SCHEDULING_MATERIAL_CODE_PREFIX)
  )
}
