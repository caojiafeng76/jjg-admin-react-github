export const DECOMPOSITION_ROLE_LABELS: Record<string, string> = {
  side_frame: '侧围',
  cross_frame: '横围',
  front_plate: '前板',
  upper_middle: '上中板',
  lower_middle: '下中板',
  rear_upper: '上后板',
  rear_lower: '下后板',
  extension_upper: '上加长板',
  extension_lower: '下加长板',
}

export const DECOMPOSITION_ROLE_OPTIONS = Object.entries(
  DECOMPOSITION_ROLE_LABELS,
).map(([value, label]) => ({ value, label }))
